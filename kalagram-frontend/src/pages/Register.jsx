import { useSearchParams } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta.js';
import PageHero from '../components/PageHero.jsx';
import RegistrationForm from '../components/RegistrationForm.jsx';
import { PatternBorder, Reveal } from '../components/Decor.jsx';

export default function Register() {
  usePageMeta('Workshop Registration', 'Register for a Kalagram natural building workshop. Choose your workshop and batch, and we will get in touch with the details and next steps.');
  const [params] = useSearchParams();

  return (
    <>
      <PageHero
        title="Workshop Registration"
        subtitle="Join our hands-on workshops and learn the art of natural building, from the earth and for the earth."
        art="/images/contact/teaching.webp"
        artAlt="A teacher explaining a house drawing to learners under a thatched roof"
        crumb={{ label: 'Register' }}
      />
      <section className="section register-page" aria-label="Registration form">
        <Reveal className="form-card">
          <RegistrationForm initialWorkshopId={params.get('workshop')} initialBatchId={params.get('batch')} />
        </Reveal>
      </section>
      <PatternBorder />
    </>
  );
}
