import { Link, useLocation } from "react-router-dom"
import logo from "../../../assets/logo.svg"
import { 
  KeyboardArrowDownOutlined, 
  KeyboardArrowUpOutlined, 
  LanguageOutlined, 
  MenuOutlined,
  CloseOutlined,
  ArrowRightAltOutlined
}from '@mui/icons-material';
import { useState } from "react";
import Dropdown from "../../../components/common/Dropdown";

const navLinks = [
  { title: "Products", path: "" },
  { title: "Pricing", path: "" },
  { title: "About", path: "" },
  { title: "Contact", path: "" },
]

const languages = [
  { title: "English", code: "EN" }
]

export default function LandingPageHeader() {

  const location = useLocation();

  const [language, setLanguage] = useState(languages[0].code);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleToggleDropdown = (dropdownName: string) => {
    setOpenDropdown(prev => (prev === dropdownName ? null : dropdownName));
  }

  const handleLanguageOption = (code: string) => {
    setLanguage(code);
    setOpenDropdown(null); 
  }

  return(
    <div className={`fixed flex items-center justify-between w-full h-[64px] px-4 md:px-5 xl:px-8 2xl:px-[220px] py-4 transition-all duration-300 ease-in-out bg-neutral-50 shadow-md`}>
      {/* Logo */}
      <div>
        <Link to={`/`}>
          <img src={logo} alt="Logo" className="h-[42px]"/>
        </Link>
      </div>

      {/* Nav Link Items */}
      <nav className="hidden md:flex gap-[32px]">
        {navLinks.map((item,idx) => {
          const isActive = location.pathname === item.path 
          return (
          <Link 
            key={idx}
            to={item.path}
            className={`body-2-regular ${isActive ? 'text-primary' : 'text-neutral-900'}`}
          >
            {item.title}
            <span className={`
              absolute left-0 -bottom-1 h-[3px] rounded-2xl w-full 
              bg-primary origin-left transform transition-all duration-300 ease-out 
              ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'} 
            `} />
          </Link>
        )})}
      </nav>

      {/* Desktop - Log in/Sign up/Language buttons*/}
      <div className="hidden md:flex paragraph-p2-medium gap-4">
        {/* Language button */}
        <Dropdown
          isOpen={openDropdown === 'language'}
          widthClass="w-full" 
          trigger={
            <button 
              onClick={() => handleToggleDropdown('language')} 
              className={`
                px-[15px] py-2.5 bg-transparent flex justify-center items-center gap-4 border-2 rounded-[8px] relative cursor-pointer transition text-neutral-900
              `}
            >
              <div className="flex gap-1.5">
                <LanguageOutlined />
                {language}
              </div>
              {openDropdown === 'language' ? <KeyboardArrowUpOutlined /> : <KeyboardArrowDownOutlined />}
            </button>
          }
        >
          {languages.map((language, index) => (
            <button 
              key={index} 
              onClick={() => handleLanguageOption(language.code)} 
              className="block w-full text-left px-4 py-2 text-neutral-900 hover:bg-neutral-200 transition cursor-pointer" 
            >
              {language.title}
            </button>
          ))}
        </Dropdown>

        {/* Login button */}
        <button className="px-5 rounded-[8px] bg-transparent hover:bg-neutral-200 text-primary border border-primary transition cursor-pointer">
          Login
        </button>

        {/* Sign up button */}
        <button className="px-5 rounded-[8px] bg-primary hover:bg-primary-hover text-neutral-50 border transition cursor-pointer flex items-center gap-1">
          Try for free <span><ArrowRightAltOutlined /></span>
        </button>
      </div>

      {/* Mobile - Log in/Sign up/Language buttons*/}
      <button
        className="md:hidden flex items-center justify-center text-sub-text p-2 transition rounded-full cursor-pointer hover:bg-neutral-200"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <CloseOutlined fontSize="large"/> : <MenuOutlined fontSize="large"/>}
      </button>
      {/* Mobile dropdown */}
      <div
        className={`
          absolute top-[64px] left-0 w-full bg-neutral-50 shadow-lg md:hidden flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out origin-top
          ${isMobileMenuOpen ? 'max-h-screen opacity-100 py-4 border-t border-divider' : 'max-h-0 opacity-0 py-0 border-none'}
        `}
      >
        <div className="flex flex-col px-6 gap-6">
          <nav className="flex flex-col gap-4">
            {navLinks.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={index} 
                  to={item.path} 
                  className={`body-2-regular ${isActive ? 'text-primary' : 'text-neutral-900'}`}
                >
                  {item.title}
                </Link>
            )})}
          </nav>
        </div>
        <hr className="text-divider my-4"/>
        <div className="flex gap-4 px-4 justify-end">
          <Dropdown
            isOpen={openDropdown === 'language'}
            widthClass="w-full" 
            trigger={
              <button 
                onClick={() => handleToggleDropdown('language')} 
                className={`
                  px-[15px] py-2.5 bg-transparent flex justify-center items-center gap-4 border-2 rounded-[8px] relative cursor-pointer transition text-neutral-900
                `}
              >
                <div className="flex gap-1.5">
                  <LanguageOutlined />
                  {language}
                </div>
                {openDropdown === 'language' ? <KeyboardArrowUpOutlined /> : <KeyboardArrowDownOutlined />}
              </button>
            }
          >
            {languages.map((language, index) => (
              <button 
                key={index} 
                onClick={() => handleLanguageOption(language.code)} 
                className="block w-full text-left px-4 py-2 text-neutral-900 hover:bg-neutral-200 transition cursor-pointer" 
              >
                {language.title}
              </button>
            ))}
          </Dropdown>
          
          {/* Login button */}
          <button className="px-5 rounded-[8px] bg-transparent hover:bg-neutral-200 text-primary border border-primary transition cursor-pointer">
            Login
          </button>

          {/* Sign up button */}
          <button className="px-5 rounded-[8px] bg-primary hover:bg-primary-hover text-neutral-50 border transition cursor-pointer flex items-center gap-1">
            Try for free <span><ArrowRightAltOutlined /></span>
          </button>
        </div>
      </div>
    </div>
  )
}