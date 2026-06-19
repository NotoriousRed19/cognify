/**
 * Button
 * 
 * @returns {JSX.Element} El componente renderizado.
 */
export default function Button({ children, className, onClick }) {
  return (
    <button
      className={className}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
