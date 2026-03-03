import logo from "../../assets/images/logo-without-text.svg"

export function Header(){
  return(
    <header>
      {/* Left side - Logo */}
      <div>
        <img src={logo} alt="Logo" className="text-primary"/>
        <p className={`text-primary header-h6`}>Your company</p> {/* Chỗ này thay thế bằng tên company*/}
      </div>

      {/* Right side */}
      <div>

      </div>

    </header>
  );
}