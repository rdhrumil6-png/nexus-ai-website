import './globals.css'
import type { Metadata } from 'next'
export const metadata: Metadata={title:'DevSphere 3D — Web Automation Studio',description:'A 3D developer workspace for automation, APIs and projects.'}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}