import Home from './pages/Home';
import Schedule from './pages/Schedule';
import Sessions from './pages/Sessions';
import Onboarding from './pages/Onboarding';
import MentorDashboard from './pages/MentorDashboard';
import Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Schedule": Schedule,
    "Sessions": Sessions,
    "Onboarding": Onboarding,
    "MentorDashboard": MentorDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};