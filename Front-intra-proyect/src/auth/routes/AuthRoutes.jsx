import { Route, Routes } from 'react-router-dom'
import { LoginStage } from '@auth/pages/LoginStage';

export const AuthRoutes = () => (
  <Routes>
    <Route path='/login' element={<LoginStage/>} />
  </Routes>
)