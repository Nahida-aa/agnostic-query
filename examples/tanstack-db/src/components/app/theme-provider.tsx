import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
};

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	systemTheme?: 'light' | 'dark'; // 新增：系统当前真实的主题
};

const initialState: ThemeProviderState = {
	theme: 'system',
	setTheme: () => null,
	// systemTheme: "light", // 新增：系统当前真实的主题
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
	children,
	defaultTheme = 'system',
	storageKey = 'vite-ui-theme',
	...props
}: ThemeProviderProps) {
	// const [theme, setTheme] = useState<Theme>(
	//   () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
	// )
	const [theme, setTheme] = useState<Theme>(defaultTheme);
	// 新增：内部状态存储系统当前真实的主题
	const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() =>
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark'
			: 'light',
	);

	// 2. only in client side, get theme from localStorage
	useEffect(() => {
		const savedTheme = localStorage.getItem(storageKey) as Theme;
		if (savedTheme) {
			setTheme(savedTheme);
		}
	}, [storageKey]); //

	// 2. 核心：监听系统主题变化并同步状态
	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

		const handleChange = () => {
			setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
		};

		// 现代浏览器使用 addEventListener
		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, []);
	// 3. 应用样式到 documentElement
	useEffect(() => {
		const root = window.document.documentElement;
		root.classList.remove('light', 'dark');

		// 如果是 system，就用我们实时维护的 systemTheme 状态
		const activeTheme = theme === 'system' ? systemTheme : theme;
		root.classList.add(activeTheme);
		// root.style.colorScheme = activeTheme;
		// root.setAttribute("data-color-mode", activeTheme);
	}, [theme, systemTheme]);
	const value = {
		theme,
		setTheme: (theme: Theme) => {
			localStorage.setItem(storageKey, theme);
			setTheme(theme);
		},
		systemTheme, // 暴露给 Hook
	};

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined)
		throw new Error('useTheme must be used within a ThemeProvider');

	return context;
};
