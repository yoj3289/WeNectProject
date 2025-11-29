import React, { useState, useEffect } from 'react';
import { Server, Database, Cpu, HardDrive, Activity, AlertTriangle, TrendingUp, Loader } from 'lucide-react';
import { getSystemMetrics } from '../../api/admin';
import type { SystemMetrics } from '../../types/admin';

const SystemMonitoringDashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 시스템 메트릭 로드
  const loadMetrics = async () => {
    try {
      const response = await getSystemMetrics();
      setMetrics(response.data);
      setError(null);
    } catch (err) {
      console.error('시스템 메트릭 조회 실패:', err);
      setError('시스템 메트릭을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 초기 로드
    loadMetrics();

    // 3초마다 자동 갱신
    const metricsTimer = setInterval(loadMetrics, 3000);

    // 시간 업데이트
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(metricsTimer);
      clearInterval(clockTimer);
    };
  }, []);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="animate-spin text-red-500" size={48} />
      </div>
    );
  }

  // 에러 상태
  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error || '데이터를 불러올 수 없습니다.'}</p>
          <button
            onClick={loadMetrics}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // Uptime을 읽기 쉬운 형식으로 변환
  const formatUptime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}일 ${hours % 24}시간`;
    } else if (hours > 0) {
      return `${hours}시간 ${minutes % 60}분`;
    } else {
      return `${minutes}분`;
    }
  };

  // 바이트를 GB로 변환
  const formatBytes = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2);
  };

  // 서버 상태 결정
  const getServerStatus = (): 'online' | 'warning' | 'offline' => {
    if (metrics.cpuUsage > 90 || metrics.memory.usagePercent > 90) {
      return 'warning';
    }
    return 'online';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-700';
      case 'offline': return 'bg-red-100 text-red-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>;
      case 'offline': return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
      case 'warning': return <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>;
      default: return <div className="w-3 h-3 bg-gray-500 rounded-full"></div>;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-50 border-red-200 text-red-700';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const serverStatus = getServerStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">시스템 모니터링</h2>
          <p className="text-sm text-gray-600 mt-1">실시간 서버 상태 및 성능 지표</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">마지막 업데이트</p>
          <p className="text-lg font-semibold text-gray-800">{currentTime.toLocaleTimeString('ko-KR')}</p>
        </div>
      </div>

      {/* 시스템 정보 카드 */}
      <div className="grid grid-cols-5 gap-6">
        {/* 서버 상태 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server size={20} className="text-blue-500" />
              <h3 className="font-bold text-gray-800">서버 상태</h3>
            </div>
            {getStatusIcon(serverStatus)}
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">CPU</span>
                <span className="text-xs font-semibold text-gray-800">{metrics.cpuUsage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getUsageColor(metrics.cpuUsage)}`}
                  style={{ width: `${Math.min(metrics.cpuUsage, 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Memory</span>
                <span className="text-xs font-semibold text-gray-800">{metrics.memory.usagePercent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getUsageColor(metrics.memory.usagePercent)}`}
                  style={{ width: `${metrics.memory.usagePercent}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatBytes(metrics.memory.used)} GB / {formatBytes(metrics.memory.total)} GB
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Disk</span>
                <span className="text-xs font-semibold text-gray-800">{metrics.disk.usagePercent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getUsageColor(metrics.disk.usagePercent)}`}
                  style={{ width: `${metrics.disk.usagePercent}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatBytes(metrics.disk.used)} GB / {formatBytes(metrics.disk.total)} GB
              </p>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">가동시간: <span className="font-semibold text-gray-800">{formatUptime(metrics.system.uptime)}</span></p>
            </div>
          </div>
        </div>

        {/* JVM 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu size={20} className="text-purple-500" />
              <h3 className="font-bold text-gray-800">JVM</h3>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-1">JVM 메모리</p>
              <p className="text-lg font-bold text-gray-800">
                {formatBytes(metrics.jvm.usedMemory)} GB
              </p>
              <p className="text-xs text-gray-500">
                / {formatBytes(metrics.jvm.maxMemory)} GB
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">활성 스레드</p>
              <p className="text-lg font-bold text-gray-800">{metrics.jvm.activeThreads}개</p>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getUsageColor((metrics.jvm.usedMemory / metrics.jvm.maxMemory) * 100)}`}
                  style={{ width: `${(metrics.jvm.usedMemory / metrics.jvm.maxMemory) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* 데이터베이스 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database size={20} className="text-orange-500" />
              <h3 className="font-bold text-gray-800">데이터베이스</h3>
            </div>
            {metrics.database.isConnected ? (
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            ) : (
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-1">DB 타입</p>
              <p className="text-sm font-semibold text-gray-800">{metrics.database.databaseType}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">버전</p>
              <p className="text-xs text-gray-800">{metrics.database.databaseVersion}</p>
            </div>

            {metrics.database.activeConnections !== null && (
              <div>
                <p className="text-xs text-gray-600 mb-1">활성 연결 / 최대 연결</p>
                <p className="text-lg font-bold text-gray-800">
                  {metrics.database.activeConnections}
                  {metrics.database.maxConnections && (
                    <span className="text-xs text-gray-500 font-normal ml-1">
                      / {metrics.database.maxConnections}
                    </span>
                  )}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      metrics.database.maxConnections &&
                      (metrics.database.activeConnections / metrics.database.maxConnections) > 0.8
                        ? 'bg-red-500'
                        : (metrics.database.activeConnections / (metrics.database.maxConnections || 1)) > 0.5
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${metrics.database.maxConnections
                        ? (metrics.database.activeConnections / metrics.database.maxConnections) * 100
                        : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">응답 시간</span>
                <span className={`text-xs font-semibold ${
                  metrics.database.responseTime < 10 ? 'text-green-600' :
                  metrics.database.responseTime < 50 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {metrics.database.responseTime}ms
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div className={`w-2 h-2 rounded-full ${metrics.database.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-xs ${metrics.database.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.database.isConnected ? '연결됨' : '연결 끊김'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 시스템 정보 */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive size={20} className="text-green-500" />
            <h3 className="font-bold text-gray-800">시스템 정보</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">운영체제</p>
              <p className="text-sm font-semibold text-gray-800">{metrics.system.osName}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">버전</p>
              <p className="text-sm font-semibold text-gray-800">{metrics.system.osVersion}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">아키텍처</p>
              <p className="text-sm font-semibold text-gray-800">{metrics.system.osArch}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">프로세서</p>
              <p className="text-sm font-semibold text-gray-800">{metrics.system.availableProcessors}코어</p>
            </div>
          </div>
        </div>
      </div>

      {/* 주요 알림 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-orange-500" />
          시스템 상태 알림
        </h3>

        <div className="space-y-4">
          {metrics.cpuUsage > 80 && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-sm font-semibold text-yellow-800">CPU 사용률 높음</p>
              <p className="text-xs text-yellow-700 mt-1">CPU 사용률: {metrics.cpuUsage.toFixed(1)}%</p>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-yellow-600">주의 필요</span>
              </div>
            </div>
          )}

          {metrics.memory.usagePercent > 80 && (
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <p className="text-sm font-semibold text-orange-800">메모리 사용률 높음</p>
              <p className="text-xs text-orange-700 mt-1">메모리 사용률: {metrics.memory.usagePercent.toFixed(1)}%</p>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-orange-600">주의 필요</span>
              </div>
            </div>
          )}

          {metrics.disk.usagePercent > 80 && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-sm font-semibold text-red-800">디스크 용량 부족</p>
              <p className="text-xs text-red-700 mt-1">디스크 사용률: {metrics.disk.usagePercent.toFixed(1)}%</p>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-600">즉시 조치</span>
              </div>
            </div>
          )}

          {metrics.cpuUsage <= 80 && metrics.memory.usagePercent <= 80 && metrics.disk.usagePercent <= 80 && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm font-semibold text-green-800">시스템 정상</p>
              <p className="text-xs text-green-700 mt-1">모든 지표가 정상 범위 내에 있습니다</p>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">정상 작동 중</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemMonitoringDashboard;
