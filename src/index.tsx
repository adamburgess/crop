import { h, render } from 'preact';
import 'preact/devtools';
import './global.css'

const root = document.getElementById('root')

function App() {
    return <div class='bg-'>
        asdasd
    </div>
}

if (root) {
    render(<App />, root);
}

export default () => console.log('what??');
