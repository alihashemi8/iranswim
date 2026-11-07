import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy, Medal, Award, Users, Calendar, Filter,
  Shield, CheckCircle2, ChevronRight, FileSpreadsheet,
  Plus, Settings, Archive, Sparkles, Sliders
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { exportToCsv } from '../../utils/exportCsv';

// League Components
import { LeagueStatsCards } from '../../components/league/LeagueStatsCards';
import { LeagueLeaderboardTable } from '../../components/league/LeagueLeaderboardTable';
import { LeagueCompetitionsView } from '../../components/league/LeagueCompetitionsView';
import { LeagueScoringRulesView } from '../../components/league/LeagueScoringRulesView';
import { LeagueSeasonsArchive } from '../../components/league/LeagueSeasonsArchive';

// Modals
import { SwimmerPerformanceModal } from '../../components/league/SwimmerPerformanceModal';
import { LeagueSeasonModal } from '../../components/league/LeagueSeasonModal';
import { CompetitionModal } from '../../components/league/CompetitionModal';
import { RecordResultsModal } from '../../components/league/RecordResultsModal';
import { ManualScoreModal } from '../../components/league/ManualScoreModal';

export const AdminLeaguesPage = () => {
  const toast = useToast();

  // Tab State: 'leaderboard' | 'competitions' | 'scoring' | 'seasons'
  const [activeTab, setActiveTab] = useState('leaderboard');

  // Main Data States
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [availableSwimmers, setAvailableSwimmers] = useState([]);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Loading States
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(false);
  const [compLoading, setCompLoading] = useState(false);

  // Modal States
  const [swimmerModalOpen, setSwimmerModalOpen] = useState(false);
  const [selectedSwimmerId, setSelectedSwimmerId] = useState(null);

  const [seasonModalOpen, setSeasonModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);

  const [compModalOpen, setCompModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState(null);

  const [recordResultsModalOpen, setRecordResultsModalOpen] = useState(false);
  const [activeCompForResults, setActiveCompForResults] = useState(null);

  const [manualScoreModalOpen, setManualScoreModalOpen] = useState(false);
  const [manualScoreSwimmer, setManualScoreSwimmer] = useState(null);

  // 1. Fetch Leagues list
  const fetchLeagues = async (preserveSelectedId = null) => {
    try {
      setLoading(true);
      const res = await api.get('/leagues/');
      const data = res.data.results || res.data || [];
      setLeagues(data);

      if (data.length > 0) {
        if (preserveSelectedId) {
          const matched = data.find((l) => l.id === preserveSelectedId);
          setSelectedLeague(matched || data[0]);
        } else if (!selectedLeague) {
          setSelectedLeague(data[0]);
        } else {
          const matched = data.find((l) => l.id === selectedLeague.id);
          setSelectedLeague(matched || data[0]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لیست فصل‌های مسابقاتی لیگ');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Swimmers list for dropdowns
  const fetchSwimmers = async () => {
    try {
      const res = await api.get('/swimmers/');
      const data = res.data.results || res.data || [];
      setAvailableSwimmers(data);
    } catch (err) {
      console.error('Error fetching swimmers:', err);
    }
  };

  useEffect(() => {
    fetchLeagues();
    fetchSwimmers();
  }, []);

  // 3. Fetch League Stats
  const fetchStats = useCallback(async () => {
    if (!selectedLeague) return;
    try {
      const res = await api.get(`/leagues/${selectedLeague.id}/stats/`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [selectedLeague]);

  // 4. Fetch Leaderboard
  const fetchLeaderboard = useCallback(async () => {
    if (!selectedLeague) return;
    try {
      setBoardLoading(true);
      const params = {};
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedGender) params.gender = selectedGender;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get(`/leagues/${selectedLeague.id}/leaderboard/`, { params });
      setLeaderboard(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت جدول رتبه‌بندی لیگ');
    } finally {
      setBoardLoading(false);
    }
  }, [selectedLeague, selectedCategory, selectedGender, searchQuery]);

  // 5. Fetch Competitions
  const fetchCompetitions = useCallback(async () => {
    if (!selectedLeague) return;
    try {
      setCompLoading(true);
      const res = await api.get(`/leagues/${selectedLeague.id}/competitions/`);
      const data = res.data.results || res.data || [];
      setCompetitions(data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت مسابقات لیگ');
    } finally {
      setCompLoading(false);
    }
  }, [selectedLeague]);

  // Refresh active league data
  useEffect(() => {
    if (selectedLeague) {
      fetchStats();
      fetchLeaderboard();
      fetchCompetitions();
    }
  }, [selectedLeague, fetchStats, fetchLeaderboard, fetchCompetitions]);

  // Handle Export CSV
  const handleExportCsv = () => {
    if (!leaderboard.length) return;
    const rows = leaderboard.map((row) => ({
      rank: row.rank,
      name: row.swimmer_name,
      category: row.category_title,
      gender: row.gender_display || (row.gender === 'FEMALE' ? 'دختران' : 'پسران'),
      matches_count: row.matches_count || 0,
      gold_medals: row.gold_medals || 0,
      silver_medals: row.silver_medals || 0,
      bronze_medals: row.bronze_medals || 0,
      points: row.total_points,
    }));

    exportToCsv(`IranSwim_Leaderboard_${selectedLeague?.name || 'League'}_${selectedLeague?.season || ''}`, rows, {
      rank: 'رتبه',
      name: 'نام و نام خانوادگی شناگر',
      category: 'رده سنی مسابقاتی',
      gender: 'جنسیت',
      matches_count: 'تعداد مسابقات',
      gold_medals: 'مدال طلا',
      silver_medals: 'مدال نقره',
      bronze_medals: 'مدال برنز',
      points: 'مجموع امتیازات رسمی لیگ',
    });
  };

  // Swimmer Detail Modal trigger
  const handleSelectSwimmer = (swimmerId) => {
    setSelectedSwimmerId(swimmerId);
    setSwimmerModalOpen(true);
  };

  // Toggle Season Status
  const handleToggleSeasonStatus = async (leagueObj, newStatus) => {
    try {
      await api.patch(`/leagues/${leagueObj.id}/`, {
        status: newStatus,
        is_active: newStatus === 'ACTIVE',
      });
      toast.success(`وضعیت دوره "${leagueObj.name}" با موفقیت تغییر یافت.`);
      fetchLeagues(leagueObj.id);
    } catch (err) {
      console.error(err);
      toast.error('خطا در تغییر وضعیت دوره لیگ');
    }
  };

  // Delete Competition
  const handleDeleteCompetition = async (compId) => {
    if (!window.confirm('آیا از حذف این رویداد مسابقه اطمینان دارید؟')) return;
    try {
      await api.delete(`/leagues/competitions/${compId}/`);
      toast.success('مسابقه با موفقیت حذف گردید.');
      fetchCompetitions();
      fetchStats();
      fetchLeaderboard();
    } catch (err) {
      console.error(err);
      toast.error('خطا در حذف مسابقه');
    }
  };

  // Refresh entire current league state
  const handleRefreshAll = () => {
    fetchLeagues(selectedLeague?.id);
    fetchStats();
    fetchLeaderboard();
    fetchCompetitions();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            مرکز مدیریت لیگ شنا و رویدادهای رقابتی آموزشگاه
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            مدیریت فصول، مسابقات، ثبت رکوردهای زمانی، قوانین شفاف امتیازدهی و جدول زنده رده‌بندی شناگران
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingSeason(null);
              setSeasonModalOpen(true);
            }}
            className="gap-1.5 text-xs h-9 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>فصل جدید</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingComp(null);
              setCompModalOpen(true);
            }}
            className="gap-1.5 text-xs h-9 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تعریف مسابقه</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingState type="cards" count={4} message="در حال بارگذاری اطلاعات دوره‌های لیگ..." />
      ) : leagues.length === 0 ? (
        <EmptyState
          title="دوره‌ای برای لیگ تعریف نشده است"
          description="با ایجاد اولین دوره لیگ، جدول رتبه‌بندی، مسابقات و امتیازدهی فعال می‌گردد."
          actionLabel="ایجاد اولین دوره لیگ"
          onAction={() => {
            setEditingSeason(null);
            setSeasonModalOpen(true);
          }}
        />
      ) : (
        <>
          {/* 2. Top Stats Dashboard (داشبورد آماری لیگ) */}
          <LeagueStatsCards
            stats={stats}
            onSelectSwimmer={handleSelectSwimmer}
          />

          {/* 3. Main Layout: Sidebar & Content Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Sidebar (Col Span 1) */}
            <div className="md:col-span-1 space-y-4">
              {/* Seasons Selector Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs transition-colors">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    فصل‌های مسابقاتی
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSeason(null);
                      setSeasonModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>ایجاد فصل</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {leagues.map((lg) => {
                    const isSelected = selectedLeague?.id === lg.id;
                    return (
                      <button
                        key={lg.id}
                        type="button"
                        onClick={() => {
                          setSelectedLeague(lg);
                          setSelectedCategory('');
                        }}
                        className={`w-full text-right p-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800 font-bold shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <span className="block truncate">{lg.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {lg.season} {lg.status === 'COMPLETED' ? '• (پایان‌یافته)' : ''}
                          </span>
                        </div>
                        {isSelected && <ChevronRight className="w-4 h-4 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* League Rules Summary Card */}
              {selectedLeague && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs text-xs space-y-2.5 transition-colors">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-white">
                      قوانین و تاریخ دوره
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('scoring')}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold"
                    >
                      ویرایش قوانین
                    </button>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>تاریخ آغاز:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {new Date(selectedLeague.starts_at).toLocaleDateString('fa-IR-u-nu-latn')}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>تاریخ پایان:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {new Date(selectedLeague.ends_at).toLocaleDateString('fa-IR-u-nu-latn')}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>وضعیت:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedLeague.status === 'ACTIVE'
                        ? 'فعال و در جریان'
                        : selectedLeague.status === 'COMPLETED'
                        ? 'پایان‌یافته'
                        : 'پیش‌نویس'}
                    </span>
                  </div>

                  {selectedLeague.rules_description && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="font-bold block mb-1">فرمول امتیازدهی:</span>
                      <p className="line-clamp-3">{selectedLeague.rules_description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Main Tabs and Content (Col Span 2 or 3) */}
            <div className="md:col-span-2 lg:col-span-3 space-y-4">
              {/* Navigation Tabs Bar - Full Width Spanning */}
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full text-xs font-bold select-none">
                <button
                  type="button"
                  onClick={() => setActiveTab('leaderboard')}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all w-full text-center cursor-pointer ${
                    activeTab === 'leaderboard'
                      ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Trophy className="w-4 h-4 shrink-0" />
                  <span>جدول رتبه‌بندی</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('competitions')}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all w-full text-center cursor-pointer ${
                    activeTab === 'competitions'
                      ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>مسابقات و رویدادها</span>
                  {competitions.length > 0 && (
                    <span className="font-mono text-[10px] bg-slate-950/10 dark:bg-white/10 px-1.5 py-0.2 rounded-full">
                      {competitions.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('scoring')}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all w-full text-center cursor-pointer ${
                    activeTab === 'scoring'
                      ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>قوانین و امتیازدهی</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('seasons')}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all w-full text-center cursor-pointer ${
                    activeTab === 'seasons'
                      ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Archive className="w-4 h-4 shrink-0" />
                  <span>آرشیو و فصول</span>
                </button>
              </div>

              {/* Tab 1: Leaderboard Table */}
              {activeTab === 'leaderboard' && (
                <LeagueLeaderboardTable
                  leaderboard={leaderboard}
                  categories={selectedLeague?.categories || []}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  selectedGender={selectedGender}
                  onGenderChange={setSelectedGender}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  loading={boardLoading}
                  onSelectSwimmer={handleSelectSwimmer}
                  onExportCsv={handleExportCsv}
                />
              )}

              {/* Tab 2: Competitions View */}
              {activeTab === 'competitions' && (
                <LeagueCompetitionsView
                  competitions={competitions}
                  loading={compLoading}
                  onOpenCreateModal={() => {
                    setEditingComp(null);
                    setCompModalOpen(true);
                  }}
                  onOpenEditModal={(comp) => {
                    setEditingComp(comp);
                    setCompModalOpen(true);
                  }}
                  onOpenRecordResultsModal={(comp) => {
                    setActiveCompForResults(comp);
                    setRecordResultsModalOpen(true);
                  }}
                  onDeleteCompetition={handleDeleteCompetition}
                  onSelectSwimmer={handleSelectSwimmer}
                />
              )}

              {/* Tab 3: Scoring Rules & Matrix */}
              {activeTab === 'scoring' && (
                <LeagueScoringRulesView
                  league={selectedLeague}
                  onOpenManualScoreModal={() => {
                    setManualScoreSwimmer(null);
                    setManualScoreModalOpen(true);
                  }}
                  onRefreshLeague={handleRefreshAll}
                />
              )}

              {/* Tab 4: Seasons Archive */}
              {activeTab === 'seasons' && (
                <LeagueSeasonsArchive
                  leagues={leagues}
                  selectedLeague={selectedLeague}
                  onSelectLeague={(lg) => {
                    setSelectedLeague(lg);
                    setSelectedCategory('');
                    setActiveTab('leaderboard');
                  }}
                  onOpenCreateModal={() => {
                    setEditingSeason(null);
                    setSeasonModalOpen(true);
                  }}
                  onOpenEditModal={(lg) => {
                    setEditingSeason(lg);
                    setSeasonModalOpen(true);
                  }}
                  onToggleStatus={handleToggleSeasonStatus}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* MODAL 1: Swimmer Performance Dossier */}
      <SwimmerPerformanceModal
        isOpen={swimmerModalOpen}
        onClose={() => setSwimmerModalOpen(false)}
        leagueId={selectedLeague?.id}
        swimmerId={selectedSwimmerId}
        onOpenManualScoreForSwimmer={(swimmerObj) => {
          setManualScoreSwimmer(swimmerObj);
          setManualScoreModalOpen(true);
        }}
      />

      {/* MODAL 2: Create / Edit Season */}
      <LeagueSeasonModal
        isOpen={seasonModalOpen}
        onClose={() => setSeasonModalOpen(false)}
        initialData={editingSeason}
        onSuccess={handleRefreshAll}
      />

      {/* MODAL 3: Create / Edit Competition */}
      <CompetitionModal
        isOpen={compModalOpen}
        onClose={() => setCompModalOpen(false)}
        leagueId={selectedLeague?.id}
        categories={selectedLeague?.categories || []}
        initialData={editingComp}
        onSuccess={handleRefreshAll}
      />

      {/* MODAL 4: Record Results & Times */}
      <RecordResultsModal
        isOpen={recordResultsModalOpen}
        onClose={() => setRecordResultsModalOpen(false)}
        competition={activeCompForResults}
        leagueScoringRules={selectedLeague?.scoring_rules}
        availableSwimmers={availableSwimmers}
        onSuccess={handleRefreshAll}
      />

      {/* MODAL 5: Manual / Bonus Score */}
      <ManualScoreModal
        isOpen={manualScoreModalOpen}
        onClose={() => setManualScoreModalOpen(false)}
        leagueId={selectedLeague?.id}
        selectedSwimmer={manualScoreSwimmer}
        availableSwimmers={availableSwimmers}
        onSuccess={handleRefreshAll}
      />
    </div>
  );
};
