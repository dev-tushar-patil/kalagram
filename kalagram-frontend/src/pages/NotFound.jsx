import { usePageMeta } from '../hooks/usePageMeta.js';
import Button from '../components/Button.jsx';

export default function NotFound() {
  usePageMeta('Page Not Found', 'This page could not be found.');
  return (
    <section className="section not-found">
      <img src="/images/about/branch.webp" alt="" />
      <h1>This path leads nowhere</h1>
      <p className="lede">The page you were looking for isn't here. Let's get you back on firm ground.</p>
      <div className="hero-actions center">
        <Button to="/" arrow>Back to Home</Button>
        <Button to="/workshops" variant="secondary">See Workshops</Button>
      </div>
    </section>
  );
}
