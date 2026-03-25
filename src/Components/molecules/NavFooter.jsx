export default function NavFooter({className, wrapperClassName}) {
    return (
        <ul className={`flex gap-5 font-semibold ${wrapperClassName || ''}`}>
            <li><a href="#" className={className}>Privacidad</a></li>
            <li><a href="#" className={className}>Terminos y condiciones</a></li>
            <li><a href="#" className={className}>Contacto</a></li>
        </ul>
    )
}
