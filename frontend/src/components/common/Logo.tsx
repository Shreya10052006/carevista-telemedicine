'use client';

/**
 * CareVista Logo Component
 * ========================
 * Consistent stethoscope logo used across all pages.
 * Supports different sizes and themes.
 */

import React from 'react';

type LogoSize = 'small' | 'medium' | 'large';
type LogoTheme = 'primary' | 'white';

interface LogoProps {
    size?: LogoSize;
    theme?: LogoTheme;
    showText?: boolean;
    className?: string;
}

const SIZES = {
    small: { icon: 24, text: 16, gap: 6 },
    medium: { icon: 32, text: 20, gap: 8 },
    large: { icon: 48, text: 28, gap: 12 },
};

const COLORS = {
    primary: {
        icon: '#0d9488', // teal-600
        text: '#0d9488',
    },
    white: {
        icon: '#ffffff',
        text: '#ffffff',
    },
};

export function Logo({
    size = 'medium',
    theme = 'primary',
    showText = true,
    className = '',
}: LogoProps) {
    const sizeConfig = SIZES[size];
    const colors = COLORS[theme];

    return (
        <div className={className} style={{
            display: 'flex',
            alignItems: 'center',
            gap: sizeConfig.gap,
        }}>
            {/* Stethoscope SVG Icon */}
            <svg
                width={sizeConfig.icon}
                height={sizeConfig.icon}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="CareVista Logo"
            >
                {/* Stethoscope tube */}
                <path
                    d="M16 8C16 8 8 8 8 20V34C8 38.4183 11.5817 42 16 42H20C24.4183 42 28 38.4183 28 34V20C28 8 20 8 20 8"
                    stroke={colors.icon}
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                />
                {/* Earpieces */}
                <circle cx="16" cy="8" r="4" fill={colors.icon} />
                <circle cx="20" cy="8" r="4" fill={colors.icon} />
                {/* Second tube */}
                <path
                    d="M48 8C48 8 40 8 40 20V34C40 38.4183 43.5817 42 48 42H52"
                    stroke={colors.icon}
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                />
                {/* Second earpieces */}
                <circle cx="44" cy="8" r="4" fill={colors.icon} />
                <circle cx="48" cy="8" r="4" fill={colors.icon} />
                {/* Connecting tube */}
                <path
                    d="M20 42V48C20 52.4183 23.5817 56 28 56H36C40.4183 56 44 52.4183 44 48V42"
                    stroke={colors.icon}
                    strokeWidth="4"
                    fill="none"
                />
                {/* Chest piece (diaphragm) */}
                <circle cx="32" cy="56" r="6" fill={colors.icon} />
                <circle cx="32" cy="56" r="3" fill={theme === 'primary' ? '#f0fdfa' : '#0d9488'} />
            </svg>

            {/* Text */}
            {showText && (
                <span style={{
                    fontSize: sizeConfig.text,
                    fontWeight: 700,
                    color: colors.text,
                    letterSpacing: '-0.5px',
                }}>
                    CareVista
                </span>
            )}
        </div>
    );
}

// Simple stethoscope emoji fallback for places where SVG might not work well
export function LogoEmoji({
    size = 'medium',
    showText = true,
}: {
    size?: LogoSize;
    showText?: boolean;
}) {
    const sizeConfig = SIZES[size];

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: sizeConfig.gap,
        }}>
            <span style={{ fontSize: sizeConfig.icon * 0.9 }}>🩺</span>
            {showText && (
                <span style={{
                    fontSize: sizeConfig.text,
                    fontWeight: 700,
                    color: '#0d9488',
                    letterSpacing: '-0.5px',
                }}>
                    CareVista
                </span>
            )}
        </div>
    );
}

export default Logo;
