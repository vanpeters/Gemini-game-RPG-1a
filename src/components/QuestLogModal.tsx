import React, { useState } from 'react';
import {
  X,
  Scroll,
  CheckCircle2,
  Circle,
  Award,
  Sparkles,
  Coins,
  ChevronRight,
  Shield,
  Swords,
  Compass,
  Flame,
  Pin,
  Check,
} from 'lucide-react';
import { Quest, QuestCategory, InventoryItem } from '../types/rpg';
import { sound } from '../utils/audio';

interface QuestLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  quests: Quest[];
  activeQuestId?: string;
  onSelectTrackedQuest: (questId: string) => void;
  onClaimReward: (questId: string) => void;
}

const CATEGORY_CONFIG: Record<
  QuestCategory,
  { label: string; color: string; bg: string; icon: any }
> = {
  main: {
    label: 'Main Story',
    color: 'text-purple-400',
    bg: 'bg-purple-950/50 border-purple-800/60',
    icon: Swords,
  },
  bounty: {
    label: 'Bounty Hunt',
    color: 'text-amber-400',
    bg: 'bg-amber-950/50 border-amber-800/60',
    icon: Shield,
  },
  heroic: {
    label: 'Heroic Raid',
    color: 'text-red-400',
    bg: 'bg-red-950/50 border-red-800/60',
    icon: Flame,
  },
  exploration: {
    label: 'Realm Lore',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/50 border-emerald-800/60',
    icon: Compass,
  },
};

export const QuestLogModal: React.FC<QuestLogModalProps> = ({
  isOpen,
  onClose,
  quests,
  activeQuestId,
  onSelectTrackedQuest,
  onClaimReward,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedQuestId, setSelectedQuestId] = useState<string>(() => {
    return activeQuestId || quests[0]?.id || '';
  });

  if (!isOpen) return null;

  const filteredQuests = quests.filter((q) => {
    if (filter === 'active') return q.status === 'active' || q.status === 'available';
    if (filter === 'completed') return q.status === 'completed' || q.status === 'claimed';
    return true;
  });

  const selectedQuest = quests.find((q) => q.id === selectedQuestId) || filteredQuests[0] || quests[0];

  const handleTabChange = (tab: 'all' | 'active' | 'completed') => {
    sound.playClick();
    setFilter(tab);
  };

  const handleSelectQuest = (qId: string) => {
    sound.playClick();
    setSelectedQuestId(qId);
  };

  const handleClaim = (qId: string) => {
    sound.playQuestFanfare();
    onClaimReward(qId);
  };

  const categoryMeta = selectedQuest ? CATEGORY_CONFIG[selectedQuest.category] : CATEGORY_CONFIG.main;
  const CategoryIcon = categoryMeta.icon;

  const isCompleted = selectedQuest?.status === 'completed';
  const isClaimed = selectedQuest?.status === 'claimed';
  const isTracked = selectedQuest?.id === activeQuestId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md font-mono select-none">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[720px] rounded-xl border border-amber-900/60 bg-slate-900 shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-900/40 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-amber-300 flex items-center gap-2">
                Quest Chronicles of Valdor
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-400">
                  {quests.filter((q) => q.status === 'completed').length} / {quests.length} Completed
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                Track active missions, earn realm renown, and unlock unique relics
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-950/70 border-b border-slate-800 text-xs">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-3 py-1 rounded transition cursor-pointer font-bold ${
              filter === 'all'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All Missions ({quests.length})
          </button>
          <button
            onClick={() => handleTabChange('active')}
            className={`px-3 py-1 rounded transition cursor-pointer font-bold ${
              filter === 'active'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Active & Available ({quests.filter((q) => q.status === 'active' || q.status === 'available').length})
          </button>
          <button
            onClick={() => handleTabChange('completed')}
            className={`px-3 py-1 rounded transition cursor-pointer font-bold ${
              filter === 'completed'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Completed ({quests.filter((q) => q.status === 'completed' || q.status === 'claimed').length})
          </button>
        </div>

        {/* Modal Body: Two Column Layout */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* Left Column: Quest List */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/40 overflow-y-auto p-3 space-y-2">
            {filteredQuests.map((q) => {
              const meta = CATEGORY_CONFIG[q.category];
              const isSelected = q.id === selectedQuest?.id;
              const completedCount = q.objectives.filter((o) => o.completed).length;
              const totalCount = q.objectives.length;

              return (
                <div
                  key={q.id}
                  onClick={() => handleSelectQuest(q.id)}
                  className={`p-3 rounded-lg border transition cursor-pointer relative ${
                    isSelected
                      ? 'border-amber-500/80 bg-amber-950/20 shadow-md'
                      : 'border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  {/* Tracked pin badge */}
                  {q.id === activeQuestId && (
                    <span className="absolute top-2 right-2 flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300 font-bold">
                      <Pin className="w-2.5 h-2.5 text-sky-400" /> Tracked
                    </span>
                  )}

                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${meta.bg} ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-slate-400">Ch. {q.chapter}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                    {q.status === 'claimed' && <Check className="w-3.5 h-3.5 text-emerald-400 inline" />}
                    {q.status === 'completed' && <Sparkles className="w-3.5 h-3.5 text-amber-400 inline animate-pulse" />}
                    {q.title}
                  </h4>

                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{q.subtitle}</p>

                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">
                      Step {completedCount}/{totalCount}
                    </span>

                    {q.status === 'claimed' && (
                      <span className="text-emerald-400 font-bold">Claimed</span>
                    )}
                    {q.status === 'completed' && (
                      <span className="text-amber-300 font-bold animate-pulse">Claim Reward!</span>
                    )}
                    {q.status === 'active' && (
                      <span className="text-sky-400 font-bold">In Progress</span>
                    )}
                    {q.status === 'available' && (
                      <span className="text-slate-400">Available</span>
                    )}
                  </div>

                  {/* Progress mini bar */}
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full transition-all duration-300 ${
                        q.status === 'completed' || q.status === 'claimed' ? 'bg-emerald-400' : 'bg-amber-500'
                      }`}
                      style={{ width: `${(completedCount / totalCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {filteredQuests.length === 0 && (
              <div className="text-center py-10 text-xs text-slate-500">
                No quests found in this category.
              </div>
            )}
          </div>

          {/* Right Column: Quest Details */}
          {selectedQuest ? (
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-slate-900/40">
              
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${categoryMeta.bg} ${categoryMeta.color} flex items-center gap-1`}>
                      <CategoryIcon className="w-3 h-3" />
                      {categoryMeta.label}
                    </span>
                    <span className="text-xs text-slate-400">Chapter {selectedQuest.chapter}</span>
                    <span className="text-xs text-slate-400">• Rec. Lv. {selectedQuest.recommendedLevel}</span>
                  </div>
                  <h3 className="text-lg font-bold text-amber-200 mt-1">{selectedQuest.title}</h3>
                  <p className="text-xs text-slate-300">{selectedQuest.subtitle}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      onSelectTrackedQuest(selectedQuest.id);
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isTracked
                        ? 'bg-sky-600 text-white shadow'
                        : 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    {isTracked ? 'Tracked on HUD' : 'Track on HUD'}
                  </button>
                </div>
              </div>

              {/* Lore & Giver */}
              <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 flex items-start gap-3">
                <div className="text-2xl p-1 bg-slate-900 rounded border border-slate-800">
                  {selectedQuest.giverIcon}
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-slate-200">{selectedQuest.giverName} (Mission Giver)</div>
                  <div className="text-slate-400 italic mt-1 leading-relaxed">
                    "{selectedQuest.lore}"
                  </div>
                </div>
              </div>

              {/* Objectives List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  Mission Objectives
                </h4>

                <div className="space-y-2">
                  {selectedQuest.objectives.map((obj) => (
                    <div
                      key={obj.id}
                      className={`p-3 rounded-lg border transition ${
                        obj.completed
                          ? 'border-emerald-800/80 bg-emerald-950/20'
                          : 'border-slate-800 bg-slate-950/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          {obj.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          )}
                          <span className={obj.completed ? 'text-emerald-300 font-semibold line-through opacity-80' : 'text-slate-200'}>
                            {obj.description}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-slate-400 font-bold ml-2">
                          {obj.currentCount} / {obj.targetCount}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            obj.completed ? 'bg-emerald-400' : 'bg-amber-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (obj.currentCount / obj.targetCount) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reward Showcase */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Quest Completion Rewards
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Currency / XP */}
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 flex items-center justify-around">
                    <div className="flex items-center gap-2 text-xs">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-slate-300">+{selectedQuest.reward.xp} EXP</span>
                    </div>
                    <div className="w-px h-6 bg-slate-800" />
                    <div className="flex items-center gap-2 text-xs">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-300 font-bold">+{selectedQuest.reward.gold} Gold</span>
                    </div>
                  </div>

                  {/* Unique Item Card */}
                  <div className="p-3 rounded-lg border border-amber-600/40 bg-gradient-to-br from-amber-950/30 to-slate-950/70 shadow flex items-center gap-3">
                    <div className="w-12 h-12 rounded border border-amber-500/50 bg-amber-950/50 flex items-center justify-center text-2xl flex-shrink-0 shadow">
                      {selectedQuest.reward.uniqueItem.icon || '🎁'}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-amber-200 truncate">
                          {selectedQuest.reward.uniqueItem.name}
                        </span>
                        <span className="text-[9px] uppercase font-bold px-1 rounded bg-amber-950 border border-amber-600 text-amber-300">
                          {selectedQuest.reward.uniqueItem.rarity || 'Unique'}
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                        {selectedQuest.reward.uniqueItem.description}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lore description of unique item */}
                <div className="text-[10px] text-slate-400 italic px-1">
                  * {selectedQuest.reward.uniqueItem.lore}
                </div>
              </div>

              {/* Action Claim Section */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  {isClaimed && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> This quest has been completed and rewards claimed.
                    </span>
                  )}
                  {isCompleted && !isClaimed && (
                    <span className="text-xs text-amber-300 font-bold animate-pulse flex items-center gap-1">
                      <Sparkles className="w-4 h-4" /> All objectives fulfilled! Claim your unique gear now.
                    </span>
                  )}
                  {!isCompleted && !isClaimed && (
                    <span className="text-xs text-slate-400">
                      Fulfill all objectives across the open world to claim unique rewards.
                    </span>
                  )}
                </div>

                {isCompleted && !isClaimed && (
                  <button
                    onClick={() => handleClaim(selectedQuest.id)}
                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-transform transform active:scale-95 cursor-pointer flex items-center gap-2 animate-pulse"
                  >
                    <Award className="w-4 h-4" />
                    Claim Unique Item & Rewards!
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
              Select a quest to view objectives and lore.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center px-5 py-2.5 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-400">
          <span>Press [Q] or click icon to toggle Quest Log anytime</span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer text-xs"
          >
            Close Journal
          </button>
        </div>

      </div>
    </div>
  );
};
