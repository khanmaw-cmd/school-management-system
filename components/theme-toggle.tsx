"use client";
import {useState} from "react";
const key="school-ui-theme";
function currentTheme(){if(typeof document==="undefined")return false;return document.documentElement.dataset.theme==="dark"||localStorage.getItem(key)==="dark"}
export default function ThemeToggle(){const [dark,setDark]=useState(currentTheme);function toggle(){const v=!dark;setDark(v);document.documentElement.dataset.theme=v?"dark":"light";localStorage.setItem(key,v?"dark":"light")}return <button type="button" onClick={toggle} aria-label={dark?"Use light mode":"Use dark mode"} className="rounded-xl border px-3 py-2 text-sm">{dark?"Light":"Dark"}</button>}
