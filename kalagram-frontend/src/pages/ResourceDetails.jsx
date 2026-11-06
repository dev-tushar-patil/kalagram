import { Link, useParams } from 'react-router-dom';
import { Clock, Download } from 'lucide-react';
import { assetUrl, publicApi } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import Button from '../components/Button.jsx';
import { PatternBorder } from '../components/Decor.jsx';
import { EmptyState, ErrorState, Loading } from '../components/States.jsx';

/** Returns a privacy-friendly embed URL for YouTube links; other links open in a new tab. */
function youtubeEmbed(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,20})/);
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
}

export default function ResourceDetails() {
  const { slug } = useParams();
  const { data: resource, loading, error, reload } = useFetch(() => publicApi.resource(slug), [slug]);
  usePageMeta(resource?.title, resource?.shortDescription);

  if (loading && !resource) return <Loading label="Loading resource" />;
  if (error?.response?.status === 404) {
    return (
      <div className="section">
        <EmptyState title="We couldn't find that resource.">
          <Button to="/resources" variant="secondary" size="small">Back to resources</Button>
        </EmptyState>
      </div>
    );
  }
  if (error) return <div className="section"><ErrorState error={error} onRetry={reload} /></div>;

  const embed = youtubeEmbed(resource.videoUrl);

  return (
    <>
      <article className="article">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span aria-hidden="true">›</span>
          <Link to="/resources">Resources</Link><span aria-hidden="true">›</span>
          <span aria-current="page">{resource.categoryName}</span>
        </nav>
        <h1>{resource.title}</h1>
        <span className="title-rule" aria-hidden="true" />
        <p className="lede">{resource.shortDescription}</p>
        {resource.readingMinutes && <p className="article-meta"><Clock size={16} aria-hidden="true" />{resource.readingMinutes} min read</p>}

        {embed ? (
          <div className="video-frame">
            <iframe src={embed} title={resource.title} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        ) : (
          resource.thumbnailUrl && <img className="article-image" src={assetUrl(resource.thumbnailUrl)} alt="" />
        )}

        {resource.videoUrl && !embed && <p><Button href={resource.videoUrl} arrow>Watch the Video</Button></p>}

        {resource.body?.split(/\n\s*\n/).filter(Boolean).map((para) => <p key={para} className="article-para">{para.trim()}</p>)}

        {resource.fileUrl && (
          <p><Button href={assetUrl(resource.fileUrl)} icon={<Download size={18} aria-hidden="true" />}>Download PDF</Button></p>
        )}

        <div className="article-foot">
          <Button to="/resources" variant="secondary" size="small">All Resources</Button>
          <Button to="/workshops" size="small" arrow>Learn This Hands-on</Button>
        </div>
      </article>
      <PatternBorder />
    </>
  );
}
