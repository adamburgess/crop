import { h, render } from 'preact';
import 'preact/devtools';
import 'tailwindcss/tailwind.css'
import './global.css'
import styles from './index.module.css'


const root = document.getElementById('root')

function App() {
    return <div><span class={styles.foo}>Crop</span> - Hi!</div>
}

if (root) {
    render(<App />, root);
}

export default () => console.log('what??');
