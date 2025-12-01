import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Container, Navbar, NavbarItem, NavbarSection, Logo } from './assets/style';
import UserList from './pages/UserList';
import StreamDemo from './pages/StreamDemo';
import QueueDemo from './pages/QueueDemo';
import logo from './assets/logo_white.png';

export default function App() {
  return (
    <BrowserRouter>
      <Container>
        <Navbar>
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Logo src={logo} alt="Presight" className="w-[120px] h-[40px]" />
          </Link>
          <div className="flex-1" /> {/* pushes the NavbarSection to the right */}

          {/* menu */}
          <NavbarSection>
            <NavbarItem href="/">User List</NavbarItem>
            <NavbarItem href="/stream">Stream Demo</NavbarItem>
            <NavbarItem href="/queue">Queue Demo</NavbarItem>
          </NavbarSection>
        </Navbar>

        <Routes>
          <Route path="/" element={<UserList />} />
          <Route path="/stream" element={<StreamDemo />} />
          <Route path="/queue" element={<QueueDemo />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}
