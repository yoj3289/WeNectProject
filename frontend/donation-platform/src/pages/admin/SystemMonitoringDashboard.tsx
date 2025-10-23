import React, { useState, useEffect } from 'react';
import { Server, Database, Cpu, HardDrive, Activity, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface ServerStatus {
  name: string;
  status: 'online' | 'offline' | 'warning';
  cpu: number;
  memory: number;
  disk: number;
  uptime: string;
}

interface ErrorLog {
  id: number;
  level: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  source: string;
}

const SystemMonitoringDashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [serverStatus, setServerStatus] = useState<ServerStatus[]>([
    { name: 'Web Server 1', status: 'online', cpu: 45, memory: 62, disk: 73, uptime: '15일 3시간' },
    { name: 'Web Server 2', status: 'online', cpu: 38, memory: 58, disk: 71, uptime: '15일 3시간' },
    { name: 'DB Server', status: 'online', cpu: 72, memory: 85, disk: 68, uptime: '30일 12시간' },
    { name: 'Cache Server', status: 'warning', cpu: 88, memory: 91, disk: 45, uptime: '7일 8시간' },
  ]);

  const [trafficData, setTrafficData] = useState([65, 72, 68, 85, 79, 92, 88, 95, 90, 102, 98, 105]);
  const [paymentFailures, setPaymentFailures] = useState(3);

  const errorLogs: ErrorLog[] = [
    { id: 1, level: 'error', message: 'Database connection timeout', timestamp: '2024-03-16 17:23:45', source: 'DB Server' },
    { id: 2, level: 'warning', message: 'High memory usage detected', timestamp: '2024-03-16 17:20:12', source: 'Cache Server' },
    { id: 3, level: 'info', message: 'Backup completed successfully', timestamp: '2024-03-16 17:15:00', source: 'Backup Service' },
    { id: 4, level: 'warning', message: 'Slow query detected (3.2s)', timestamp: '2024-03-16 17:10:33', source: 'DB Server' },
    { id: 5, level: 'error', message: 'Payment gateway timeout', timestamp: '2024-03-16 17:05:21', source: 'Payment Service' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());

      // 서버 상태 랜덤 업데이트 (실시간 시뮬레이션)
      setServerStatus(prev => prev.map(server => ({
        ...server,
        cpu: Math.max(20, Math.min(95, server.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(30, Math.min(95, server.memory + (Math.random() - 0.5) * 8)),
      })));

      // 트래픽 데이터 업데이트
      setTrafficData(prev => {
        const newData = [...prev.slice(1), Math.floor(Math.random() * 40) + 80];
        return newData;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

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

      {/* 서버 상태 카드 */}
      <div className="grid grid-cols-4 gap-6">
        {serverStatus.map((server, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server size={20} className="text-blue-500" />
                <h3 className="font-bold text-gray-800">{server.name}</h3>
              </div>
              {getStatusIcon(server.status)}
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">CPU</span>
                  <span className="text-xs font-semibold text-gray-800">{server.cpu.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getUsageColor(server.cpu)}`}
                    style={{ width: `${server.cpu}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Memory</span>
                  <span className="text-xs font-semibold text-gray-800">{server.memory.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getUsageColor(server.memory)}`}
                    style={{ width: `${server.memory}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Disk</span>
                  <span className="text-xs font-semibold text-gray-800">{server.disk}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getUsageColor(server.disk)}`}
                    style={{ width: `${server.disk}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-600">가동시간: <span className="font-semibold text-gray-800">{server.uptime}</span></p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 트래픽 및 통계 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 트래픽 그래프 */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Activity size={20} className="text-red-500" />
                실시간 트래픽
              </h3>
              <p className="text-sm text-gray-600 mt-1">최근 12개 데이터 포인트</p>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-red-500" />
              <span className="text-lg font-bold text-red-600">+12.5%</span>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-2">
            {trafficData.map((value, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-red-500 to-pink-500 rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${(value / 120) * 100}%` }}
                ></div>
                <span className="text-xs text-gray-600 mt-2">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 주요 지표 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" />
            주요 알림
          </h3>

          <div className="space-y-4">
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-sm font-semibold text-yellow-800">캐시 서버 과부하</p>
              <p className="text-xs text-yellow-700 mt-1">CPU 사용률 88%</p>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-yellow-600">주의 필요</span>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-sm font-semibold text-red-800">결제 실패</p>
              <p className="text-xs text-red-700 mt-1">최근 1시간: {paymentFailures}건</p>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-600">즉시 조치</span>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm font-semibold text-green-800">백업 완료</p>
              <p className="text-xs text-green-700 mt-1">일일 백업 성공</p>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">정상</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 에러 로그 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            최근 에러 로그
          </h3>
          <p className="text-sm text-gray-600 mt-1">시스템 이벤트 및 오류 기록</p>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {errorLogs.map((log) => (
              <div key={log.id} className={`rounded-lg p-4 border ${getLevelColor(log.level)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 text-xs font-bold uppercase rounded">
                        {log.level}
                      </span>
                      <span className="text-xs text-gray-600">{log.source}</span>
                    </div>
                    <p className="font-semibold">{log.message}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitoringDashboard;
