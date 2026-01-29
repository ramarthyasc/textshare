import App from './App';
 
const routes = [
    {
        path: "/",
        element: <App />, // Navigation bar
        // Children are the things that are presented in the <Outlet/>

    },
    {
        path: '*',
        element: <div className='font-bold text-4xl mt-5 text-center'>404 Not Found</div>
    }
]



export default routes;
