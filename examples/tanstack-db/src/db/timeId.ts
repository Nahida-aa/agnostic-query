// 13 位时间戳 (100年后变 14 位) + 10 位随机字符串

// 字母数字集
const alphabet =
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const randomString = (length: number): string => {
	// 用密码学安全的随机数生成器
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	let result = '';
	for (let i = 0; i < length; i++) {
		result += alphabet[bytes[i] % alphabet.length];
		// bytes[i] 的范围是 0–255 的均匀分布，alphabet.length 是 62。因为 256 不能被 62 整除（256 = 62×4 + 8），这会导致前 8 个字符（0–7）比其他字符出现概率略高（高出约 0.015%）
		// 在生成唯一 ID 的用途里完全可以忽略
	}
	return result;
};

export const timeId = (size = 10) => `${Date.now()}_${randomString(size)}`;
