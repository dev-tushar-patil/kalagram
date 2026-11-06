import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';

const MotionLink = motion.create(Link);

const hover = { scale: 1.03, y: -1 };
const tap = { scale: 0.98 };

/**
 * The site button. Renders a router link (`to`), an external link (`href`) or a <button>.
 * variant: primary | secondary | light. `arrow` adds the sliding arrow from the designs.
 */
const Button = forwardRef(function Button(
  { to, href, variant = 'primary', size, arrow, icon, loading, className = '', children, ...rest },
  ref,
) {
  const classes = `btn btn-${variant} ${size === 'small' ? 'btn-small' : ''} ${className}`;
  const content = (
    <>
      {loading ? <Loader2 size={18} className="spin" aria-hidden="true" /> : icon}
      <span>{children}</span>
      {arrow && <ArrowRight size={18} className="btn-arrow" aria-hidden="true" />}
    </>
  );

  if (to) {
    return <MotionLink ref={ref} to={to} className={classes} whileHover={hover} whileTap={tap} {...rest}>{content}</MotionLink>;
  }
  if (href) {
    return (
      <motion.a ref={ref} href={href} target="_blank" rel="noopener noreferrer" className={classes} whileHover={hover} whileTap={tap} {...rest}>
        {content}
      </motion.a>
    );
  }
  return (
    <motion.button
      ref={ref}
      type="button"
      className={classes}
      whileHover={rest.disabled || loading ? undefined : hover}
      whileTap={rest.disabled || loading ? undefined : tap}
      {...rest}
      disabled={rest.disabled || loading}
    >
      {content}
    </motion.button>
  );
});

export default Button;
