import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';

// Lazy load screens
const HomeScreen = lazy(() => import('./components/screens/HomeScreen'));
const ProductDetailScreen = lazy(() => import('./components/screens/ProductDetailScreen'));
const CartScreen = lazy(() => import('./components/screens/CartScreen'));
const CheckoutScreen = lazy(() => import('./components/screens/CheckoutScreen'));
const SignupScreen = lazy(() => import('./components/screens/SignupScreen'));
const ProfileScreen = lazy(() => import('./components/screens/ProfileScreen'));
const WishlistScreen = lazy(() => import('./components/screens/WishlistScreen'));
const OrderTrackingScreen = lazy(() => import('./components/screens/OrderTrackingScreen'));
const SearchScreen = lazy(() => import('./components/screens/SearchScreen'));
const LoginScreen = lazy(() => import('./components/screens/LoginScreen'));
const AdminRoute = lazy(() => import('./components/admin/AdminRoute'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./components/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./components/admin/AdminOrders'));
const AdminUsers = lazy(() => import('./components/admin/AdminUsers'));
const AdminNotifications = lazy(() => import('./components/admin/AdminNotifications'));
const AdminSettings = lazy(() => import('./components/admin/AdminSettings'));
const AdminCoupons = lazy(() => import('./components/admin/AdminCoupons'));
const AdminBanners = lazy(() => import('./components/admin/AdminBanners'));
const AdminCategories = lazy(() => import('./components/admin/AdminCategories'));
const AdminWithdrawals = lazy(() => import('./components/admin/AdminWithdrawals'));
const NotificationsScreen = lazy(() => import('./components/screens/NotificationsScreen'));
const CategoryScreen = lazy(() => import('./components/screens/CategoryScreen'));
const CompleteProfileScreen = lazy(() => import('./components/screens/CompleteProfileScreen'));

import { CartProvider } from './lib/CartContext';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <CartProvider>
      <Router>
        <AppShell>
          <Toaster 
            position="top-center"
            toastOptions={{
              className: 'font-bengali font-bold rounded-2xl shadow-xl',
              duration: 3000,
            }}
          />
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/category/:id" element={<CategoryScreen />} />
              <Route path="/product/:id" element={<ProductDetailScreen />} />
              <Route path="/cart" element={<CartScreen />} />
              <Route path="/checkout" element={<CheckoutScreen />} />
              <Route path="/signup" element={<SignupScreen />} />
              <Route path="/search" element={<SearchScreen />} />
              <Route path="/wishlist" element={<WishlistScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/notifications" element={<NotificationsScreen />} />
              <Route path="/tracking/:orderNumber?" element={<OrderTrackingScreen />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/complete-profile" element={<CompleteProfileScreen />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="withdrawals" element={<AdminWithdrawals />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppShell>
      </Router>
    </CartProvider>
  );
}
