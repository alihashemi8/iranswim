import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SwimmerContext = createContext(null);

export const SwimmerProvider = ({ children }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [childrenList, setChildrenList] = useState([]);
  const [activeSwimmerId, setActiveSwimmerId] = useState(() => {
    return localStorage.getItem('active_swimmer_id') || null;
  });
  const [loading, setLoading] = useState(false);

  const fetchChildren = useCallback(async () => {
    if (!user || (user.role !== 'SWIMMER' && !user.is_superuser)) {
      setChildrenList([]);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/swimmers/my-children/');
      const list = res.data || [];
      setChildrenList(list);

      // Verify active swimmer id
      const savedId = localStorage.getItem('active_swimmer_id');
      const found = list.find((item) => String(item.swimmer) === String(savedId) || String(item.swimmer_detail?.id) === String(savedId));

      if (found) {
        const id = String(found.swimmer_detail?.id || found.swimmer);
        setActiveSwimmerId(id);
        localStorage.setItem('active_swimmer_id', id);
      } else if (list.length > 0) {
        const firstId = String(list[0].swimmer_detail?.id || list[0].swimmer);
        setActiveSwimmerId(firstId);
        localStorage.setItem('active_swimmer_id', firstId);
      }
    } catch (err) {
      console.error('Error fetching children:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const selectChild = (childId) => {
    const strId = String(childId);
    setActiveSwimmerId(strId);
    localStorage.setItem('active_swimmer_id', strId);
    window.dispatchEvent(new CustomEvent('swimmer:switched', { detail: { swimmerId: strId } }));
  };

  const activeSwimmer = childrenList.find(
    (item) => String(item.swimmer) === String(activeSwimmerId) || String(item.swimmer_detail?.id) === String(activeSwimmerId)
  )?.swimmer_detail || null;

  const addChild = async ({ first_name, last_name, national_id, gender, relationship_type }) => {
    try {
      const res = await api.post('/swimmers/my-children/', {
        first_name,
        last_name,
        national_id,
        gender,
        relationship_type,
      });
      await fetchChildren();
      const newId = String(res.data?.swimmer_detail?.id || res.data?.swimmer);
      if (newId) {
        selectChild(newId);
      }
      toast.success(`پرونده ${first_name} با موفقیت ثبت شد و به حساب شما افزوده گردید.`);
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.detail || 'خطا در ثبت فرزند جدید.';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  return (
    <SwimmerContext.Provider
      value={{
        childrenList,
        activeSwimmer,
        activeSwimmerId,
        selectChild,
        addChild,
        refreshChildren: fetchChildren,
        loading,
      }}
    >
      {children}
    </SwimmerContext.Provider>
  );
};

export const useSwimmer = () => {
  const ctx = useContext(SwimmerContext);
  if (!ctx) {
    return {
      childrenList: [],
      activeSwimmer: null,
      activeSwimmerId: null,
      selectChild: () => {},
      addChild: async () => {},
      refreshChildren: () => {},
      loading: false,
    };
  }
  return ctx;
};
