import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import MemberLayout from './layouts/MemberLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import './styles/ui.css';
import './pages/pages.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Deposit = lazy(() => import('./pages/Deposit'));
const Join = lazy(() => import('./pages/Join'));
const Profile = lazy(() => import('./pages/Profile'));
const WalletHistory = lazy(() => import('./pages/WalletHistory'));
const Admin = lazy(() => import('./pages/Admin'));
const DepositHistory = lazy(() => import('./pages/DepositHistory'));
const DirectTeam = lazy(() => import('./pages/DirectTeam'));
const AllTeam = lazy(() => import('./pages/AllTeam'));
const RoiIncome = lazy(() => import('./pages/RoiIncome'));
const DirectIncome = lazy(() => import('./pages/DirectIncome'));
const LevelIncome = lazy(() => import('./pages/LevelIncome'));
const SalaryIncome = lazy(() => import('./pages/SalaryIncome'));
const RankRewards = lazy(() => import('./pages/RankRewards'));
const LiveFeed = lazy(() => import('./pages/LiveFeed'));
const Trading = lazy(() => import('./pages/Trading'));
const PlanDetails = lazy(() => import('./pages/PlanDetails'));
const MyAccount = lazy(() => import('./pages/MyAccount'));
const Transfer = lazy(() => import('./pages/Transfer'));
const Support = lazy(() => import('./pages/Support'));
const Notifications = lazy(() => import('./pages/Notifications'));
const WithdrawalsPage = lazy(() => import('./pages/WithdrawalsPage'));
const Compound = lazy(() => import('./pages/Compound'));

function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
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
                <Route path="/rank-rewards" element={<RankRewards />} />
                <Route path="/system-live-feed" element={<LiveFeed />} />
                <Route path="/trading" element={<Trading />} />
                <Route path="/plan-details" element={<PlanDetails />} />
                <Route path="/my-account" element={<MyAccount />} />
                <Route path="/transfer" element={<Transfer />} />
                <Route path="/support" element={<Support />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/withdrawals" element={<WithdrawalsPage />} />
                <Route path="/withdraw" element={<Navigate to="/withdrawals" replace />} />
                <Route path="/team" element={<Navigate to="/direct-team" replace />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="/admin" element={<Admin />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
