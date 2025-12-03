import React, { useState } from 'react';
import { User, Bell, Check } from 'lucide-react';

interface ProfileEditSectionProps {
  initialProfile?: {
    name: string;
    email: string;
    phone: string;
  };
  initialNotifications?: {
    donation: boolean;
    project: boolean;
    comment: boolean;
  };
  onSave?: (profile: any, notifications: any) => void;
  onCancel?: () => void;
}

const ProfileEditSection: React.FC<ProfileEditSectionProps> = ({
  initialProfile = {
    name: '',
    email: '',
    phone: '',
  },
  initialNotifications = {
    donation: true,
    project: true,
    comment: true,
  },
  onSave,
  onCancel,
}) => {
  const [profile, setProfile] = useState(initialProfile);
  const [notifications, setNotifications] = useState(initialNotifications);

  // 토글 스위치 컴포넌트
  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        checked ? 'bg-amber-500' : 'bg-stone-300'
      }`}
    >
      <div
        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );

  const handleSave = () => {
    if (onSave) {
      onSave(profile, notifications);
    }
  };

  return (
    <div className="space-y-6">
      {/* 기본 정보 카드 */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <User className="text-amber-600" size={20} />
          </div>
          <h3 className="text-lg font-bold text-stone-900">기본 정보 수정</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">이름</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">이메일</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">전화번호</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-stone-300 hover:bg-stone-50 rounded-xl font-semibold text-stone-700 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Check size={18} />
            저장
          </button>
        </div>
      </div>

      {/* 알림 설정 카드 */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Bell className="text-blue-600" size={20} />
          </div>
          <h3 className="text-lg font-bold text-stone-900">알림 설정</h3>
        </div>

        <div className="space-y-1">
          {[
            { key: 'donation', label: '기부 관련 알림', desc: '기부 완료, 영수증 발급 등' },
            { key: 'project', label: '프로젝트 관련 알림', desc: '관심 프로젝트 업데이트' },
            { key: 'comment', label: '댓글 알림', desc: '내 글에 달린 댓글, 답글' },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-4 border-b border-stone-100 last:border-0"
            >
              <div>
                <p className="font-medium text-stone-900">{item.label}</p>
                <p className="text-sm text-stone-500">{item.desc}</p>
              </div>
              <ToggleSwitch
                checked={notifications[item.key as keyof typeof notifications]}
                onChange={() =>
                  setNotifications({
                    ...notifications,
                    [item.key]: !notifications[item.key as keyof typeof notifications],
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileEditSection;
