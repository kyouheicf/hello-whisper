export interface Env {
	AI: Ai;
}

function base64Encode(buf) {
	let string = '';
	new Uint8Array(buf).forEach((byte) => {
		string += String.fromCharCode(byte);
	});
	return btoa(string);
}

function formatTimeHISM(seconds, { short = false } = {}) {
	const pad = (num) => (num < 10 ? `0${num}` : num);

	const H = pad(Math.floor(seconds / 3600));
	const i = pad(Math.floor((seconds % 3600) / 60));
	const s = pad(Math.floor(seconds % 60));
	const m = `${Math.round((seconds % 1) * 1000)}`.toString().padStart(3, '0');

	if (short) {
		let result = '';
		if (H > 0) result += `${+H}:`;
		result += `${H > 0 ? i : +i}:${s}`;
		return result;
	} else {
		return `${H}:${i}:${s}.${m}`;
	}
}

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);
		const data_url = url.pathname.replace(/^\//g, '');
		const res = await fetch(
			data_url
		);
		const blob = await res.arrayBuffer();

		const input = {
			audio: base64Encode(blob), // Base64
			language: 'ja', // String
			//vad_filter: 'true',
			//without_timestamps: 'true',
			// やさしい日本語のサンプル文章
			initial_prompt: '1 日の PM 2.5 の量が、 70 μg / m^2 を超えたときは、外に出ることをできるだけ少なくしましょう。そして、外での長い時間の激しい運動はできるだけ少なくしましょう。病気（呼吸器や循環器）の人、小さな子ども、お年寄りの方は、体調に気をつけましょう。',
			//initial_prompt: 'You are the best Japanese translator.',
		};

		let response = await env.AI.run(
			'@cf/openai/whisper-large-v3-turbo',
			//'@cf/openai/whisper-large-v3',
			input
		);
		//console.log(response) 

		const segments = response.segments;
		let segment_vtt = 'WEBVTT\n\n';
		for (let segment of segments) {
			segment_vtt += `${formatTimeHISM(segment.start)} --> ${formatTimeHISM(segment.end)}\n${segment.text}\n\n`;
		}
		console.log(segment_vtt);
		response.segment_vtt = segment_vtt;

		return Response.json({ input: { audio: [] }, response });
	},
} satisfies ExportedHandler<Env>;
