'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock, Users, User } from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { href: '/',        icon: Home,  label: 'Home'    },
  { href: '/past',    icon: Clock, label: 'Past'    },
  { href: '/friends', icon: Users, label: 'Friends' },
  { href: '/profile', icon: User,  label: 'Profile' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2"
         style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(56,189,248,0.1)' }}>
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href
        return (
          <Link key={href} href={href}
                className={clsx(
                  'flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-200',
                  active
                    ? 'text-ice-300'
                    : 'text-dark-600 hover:text-ice-400/60'
                )}>
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8}
                  className={clsx('transition-all duration-200', active && 'drop-shadow-[0_0_6px_rgba(56,189,248,0.7)]')} />
            <span className={clsx('text-[10px] font-bold tracking-wide', active ? 'text-ice-300' : 'text-slate-500')}>
              {label}
            </span>
            {active && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-ice-400"
                    style={{ boxShadow: '0 0 6px #38bdf8' }} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
