import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * SwimmerSchedulePage has been merged into SwimmerCoursesPage.
 * Any direct access redirects to /swimmer/courses?tab=my-courses
 */
export const SwimmerSchedulePage = () => {
  return <Navigate to="/swimmer/courses?tab=my-courses" replace />;
};
