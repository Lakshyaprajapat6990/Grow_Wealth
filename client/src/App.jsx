import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import MemberLayout from './layouts/MemberLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Deposit from './pages/Deposit';
import Join from './pages/Join';
import Profile from './pages/Profile';
import WalletHistory from './pages/WalletHistory';
import Admin from './pages/Admin';
import DepositHistory from './pages/DepositHistory';
import DirectTeam from './pages/DirectTeam';
import AllTeam from './pages/AllTeam';
import RoiIncome from './pages/RoiIncome';
import DirectIncome from './pages/DirectIncome';
import LevelIncome from './pages/LevelIncome';
import SalaryIncome from './pages/SalaryIncome';
import LiveFeed from './pages/LiveFeed';
import Trading from './pages/Trading';
import PlanDetails from './pages/PlanDetails';
import MyAccount from './pages/MyAccount';
import Transfer from './pages/Transfer';
import Support from './pages/Support';
import Notifications from './pages/Notifications';
import WithdrawalsPage from './pages/WithdrawalsPage';
import Compound from './pages/Compound';
import './styles/ui.css';
import './pages/pages.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/certificates" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MemberLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/deposit" element={<Deposit />} />
              <Route path="/join" element={<Join />} />
              <Route path="/compound" element={<Compound />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/wallet-history" element={<WalletHistory />} />
              <Route path="/deposit-history" element={<DepositHistory />} />
              <Route path="/direct-team" element={<DirectTeam />} />
              <Route path="/all-team" element={<AllTeam />} />
              <Route path="/roi-income" element={<RoiIncome />} />
              <Route path="/direct-income" element={<DirectIncome />} />
              <Route path="/level-income" element={<LevelIncome />} />
              <Route path="/salary-income" element={<SalaryIncome />} />
              <Route path="/system-live-feed" element={<LiveFeed />} />
              <Route path="/trading" element={<Trading />} />
              <Route path="/plan-details" element={<PlanDetails />} />
              <Route path="/my-account" element={<MyAccount />} />
              <Route path="/transfer" element={<Transfer />} />
              <Route path="/support" element={<Support />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/withdrawals" element={<WithdrawalsPage />} />
              {/* Legacy redirects */}
              <Route path="/withdraw" element={<Navigate to="/withdrawals" replace />} />
              <Route path="/team" element={<Navigate to="/direct-team" replace />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
