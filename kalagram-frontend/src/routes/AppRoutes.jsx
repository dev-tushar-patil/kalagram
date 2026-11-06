import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import SiteLayout from '../layouts/SiteLayout.jsx';
import { Loading } from '../components/States.jsx';
import Home from '../pages/Home.jsx';

const About = lazy(() => import('../pages/About.jsx'));
const Workshops = lazy(() => import('../pages/Workshops.jsx'));
const WorkshopDetails = lazy(() => import('../pages/WorkshopDetails.jsx'));
const Gallery = lazy(() => import('../pages/Gallery.jsx'));
const Resources = lazy(() => import('../pages/Resources.jsx'));
const ResourceDetails = lazy(() => import('../pages/ResourceDetails.jsx'));
const Contact = lazy(() => import('../pages/Contact.jsx'));
const Register = lazy(() => import('../pages/Register.jsx'));
const NotFound = lazy(() => import('../pages/NotFound.jsx'));

// The admin panel is its own bundle so public visitors never download it.
const AdminApp = lazy(() => import('../pages/admin/AdminApp.jsx'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading label="Loading" />}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="workshops" element={<Workshops />} />
          <Route path="workshops/:slug" element={<WorkshopDetails />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="resources" element={<Resources />} />
          <Route path="resources/:slug" element={<ResourceDetails />} />
          <Route path="contact" element={<Contact />} />
          <Route path="register" element={<Register />} />
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
