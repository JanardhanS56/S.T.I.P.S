export function Card({
  variant = 'default', // 'default' | 'strong' | 'composer'
  as: Component = 'div',
  children,
  className = '',
  ...props
}) {
  const variantClass =
    variant === 'strong' ? 'card-strong' : variant === 'composer' ? 'composer' : '';

  return (
    <Component className={`card ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}

export default Card;
