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
			initial_prompt: '',
		};

		let response = await env.AI.run(
			'@cf/openai/whisper-large-v3-turbo',
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

//"https://github.com/Azure-Samples/cognitive-services-speech-sdk/raw/master/samples/cpp/windows/console/samples/enrollment_audio_katie.wav"
//'https://github.com/burgil/whisper-test/raw/main/test1.mp3'
//"https://storage.googleapis.com/ondoku3/media/8398451bedca05afe643d933554497b9264c96106490cf0617da961b.mp3"
//"https://pub-09eb6533a1c846af8df578e9f16623f7.r2.dev/cf-video.mp4"
//"https://pub-09eb6533a1c846af8df578e9f16623f7.r2.dev/cf-video.mp3"
//"https://clrd.ninjal.ac.jp/csj/sound-f/aps-smp.mp3"
//"https://clrd.ninjal.ac.jp/csj/sound-f/interview_aps-smp.mp3"
//"https://www.nhk.or.jp/lesson/en/mp3/audio_lesson_06.mp3"
//"https://www.city.takasaki.gunma.jp/uploaded/attachment/26016.mp3"
//"https://pub-09eb6533a1c846af8df578e9f16623f7.r2.dev/pitch2023.mp3"
//"https://cdn.pixabay.com/download/audio/2022/03/09/audio_f9f5c8899d.mp3?filename=japanese-conversation-23645.mp3"
//"https://www.city.uonuma.lg.jp/uploaded/attachment/12268.mp3"
//"https://www.sagamihara-shigikai.jp/doc/2024050900019/file_contents/a000008.mp3"

