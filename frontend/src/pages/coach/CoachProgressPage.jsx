import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Users, Award, Search, Filter,
  ChevronLeft, CheckCircle2, AlertCircle, PlusCircle
} from 'lucide-react';
import api from '../../api/client';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const CoachProgressPage = () => {
  const [swimmers, setSwimmers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesRes, enrRes] = await Promise.all([
          api.get('/coaches/my-classes/'),
          api.get('/education/enrollments/'),
        ]);

        const clsList = classesRes.data || [];
        setClasses(clsList);

        const enrList = enrRes.data.results || enrRes.data || [];
        // Unique swimmers
        const uniqueSwimmersMap = {};
        enrList.forEach((en) => {
          if (!uniqueSwimmersMap[en.swimmer]) {
            uniqueSwimmersMap[en.swimmer] = {
              swimmer_id: en.swimmer,
              full_name: en.swimmer_name,
              group_id: en.group,
              group_name: en.group_name,
              sessions_attended: en.sessions_attended,
              sessions_purchased: en.sessions_purchased,
            };
          }
        });
        setSwimmers(Object.values(uniqueSwimmersMap));
      } catch (err) {
        console.error('Error fetching swimmers progress:', err);
        toast.error('خطا در دریافت لیست پیشرفت شناگران');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSwimmers = swimmers.filter((sw) => {
    const matchesSearch = sw.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'ALL' || sw.group_id === Number(selectedClass);
    return matchesSearch && matchesClass;
  });

  if (loading) {
    return <LoadingState type="table" message="در حال بارگذاری کارنامه و پیشرفت شناگران..." />;
  }

  return (
    <div className="space-y-6 pb-12 coach-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
            ارزیابی و پیشرفت شناگران
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            سنجش مهارت‌های تخصصی شنا، ثبت ارزیابی دوره‌ای و کارنامه انفرادی شاگردان
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/coach/exams"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-base font-bold shadow-xs transition-all active:scale-95"
          >
            <Award className="w-4.5 h-4.5" />
            آزمون‌ها و پیشنهاد ارتقا
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جست‌وجوی نام شناگر..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">کلاس:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">همه کلاس‌های من ({classes.length})</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.skill_level_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Swimmers Roster Grid / Table */}
      {filteredSwimmers.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/60 font-bold text-sm">
                <tr>
                  <th className="py-3.5 px-4">نام شناگر</th>
                  <th className="py-3.5 px-4">کلاس آموزشی</th>
                  <th className="py-3.5 px-4">جلسات حضور</th>
                  <th className="py-3.5 px-4 text-center">پرونده عملکرد و مهارت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSwimmers.map((sw) => (
                  <tr key={sw.swimmer_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                          {sw.full_name?.charAt(0) || 'ش'}
                        </div>
                        <span className="text-sm sm:text-base">{sw.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 text-sm">
                      {sw.group_name || 'کلاس من'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sm">
                      {sw.sessions_attended} از {sw.sessions_purchased} جلسه
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        to={`/coach/progress/${sw.swimmer_id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white font-bold transition-all text-xs sm:text-sm"
                      >
                        <TrendingUp className="w-4 h-4" />
                        مشاهده پرونده و ثبت ارزیابی
                        <ChevronLeft className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-2">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">شناگری یافت نشد</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            شناگری مطابق فیلترهای انتخابی در کلاس‌های شما وجود ندارد.
          </p>
        </div>
      )}
    </div>
  );
};
