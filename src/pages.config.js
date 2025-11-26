import Home from './pages/Home';
import Schedule from './pages/Schedule';
import Sessions from './pages/Sessions';
import Onboarding from './pages/Onboarding';
import MentorDashboard from './pages/MentorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Welcome from './pages/Welcome';
import MenteeQuestionnaire from './pages/MenteeQuestionnaire';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Schedule": Schedule,
    "Sessions": Sessions,
    "Onboarding": Onboarding,
    "MentorDashboard": MentorDashboard,
    "AdminDashboard": AdminDashboard,
    "Welcome": Welcome,
    "MenteeQuestionnaire": MenteeQuestionnaire,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};