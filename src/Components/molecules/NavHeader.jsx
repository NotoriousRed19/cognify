import Link from "next/link";

export default function NavHeader({ className, wrapperClassName }) {
  return (
    <ul className={`flex gap-5 font-semibold ${wrapperClassName || ""}`}>
      <li>
        <Link href="/#Hero" className={className}>
          Inicio
        </Link>
      </li>
      <li>
        <Link href="/#Funciones" className={className}>
          Servicios
        </Link>
      </li>
      <li>
        <Link href="/#Testimonios" className={className}>
          Testimonios
        </Link>
      </li>
      <li>
        <Link href="/#Precios" className={className}>
          Precios
        </Link>
      </li>
    </ul>
  );
}
