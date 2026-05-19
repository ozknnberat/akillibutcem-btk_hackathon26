import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import IndexPage from './pages/Index'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Login from './modules/login-page/login-page'
import Register from './modules/register-page/register-page'
import NotFound from './pages/NotFound'
import Settings from './pages/Settings'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <IndexPage /> },
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/history', element: <History /> },
      { path: '/settings', element: <Settings /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '*', element: <NotFound /> },
    ]
  }
])
