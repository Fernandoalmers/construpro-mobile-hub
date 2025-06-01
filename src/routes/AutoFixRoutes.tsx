
import React from 'react';
import { Route } from 'react-router-dom';
import AutoFixCodesPage from '../pages/AutoFixCodes';

const AutoFixRoutes: React.FC = () => {
  return (
    <>
      <Route path="/auto-fix-codes" element={<AutoFixCodesPage />} />
    </>
  );
};

export default AutoFixRoutes;
