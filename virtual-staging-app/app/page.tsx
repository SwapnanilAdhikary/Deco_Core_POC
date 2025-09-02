'use client';

import { useState } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

export default function HomePage() {
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [prompt, setPrompt] = useState('A modern minimal living room, clean design, photorealistic');
	const [negativePrompt, setNegativePrompt] = useState('lowres, blurry, distorted, cartoonish');
	const [ckptName, setCkptName] = useState('juggernaut_reborn.safetensors');
	const [seed, setSeed] = useState('');
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState<{ image: string; file_url?: string; seed?: number }[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [numImages, setNumImages] = useState(1);
	const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/generate';

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setResults([]);
		if (!imageFile) {
			setError('Please upload an image.');
			return;
		}
		setLoading(true);
		try {
			const form = new FormData();
			form.append('image_file', imageFile);
			form.append('prompt_text', prompt);
			form.append('negative_prompt_text', negativePrompt);
			form.append('ckpt_name', ckptName);
			form.append('num_images', String(numImages));
			if (seed) form.append('seed', seed);
			form.append('workflow', 'joger.json');

			const res = await fetch(backendUrl, { method: 'POST', body: form });
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error((data as any).error || `Request failed: ${res.status}`);
			}
			const data = (await res.json()) as {
				results?: { image: string; file_url?: string; seed?: number }[];
				error?: string;
			};
			if (data.results && data.results.length > 0) setResults(data.results);
			else setError(data.error || 'No images returned');
		} catch (err: any) {
			setError(err.message || 'Unknown error');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			<div className="header">
				<div>
					<div className="title">Deco_Core</div>
					<div className="subtitle">Proof of Concept</div>
				</div>
			</div>
			<div className="grid">
				<div className="card">
					<div className="section-title">Inputs</div>
					<form className="form" onSubmit={handleSubmit}>
						<label className="label">
							<span>Upload image</span>
							<input
								className="file"
								type="file"
								accept="image/*"
								onChange={(e) => setImageFile(e.target.files?.[0] || null)}
							/>
						</label>
						<label className="label">
							<span>Positive prompt</span>
							<textarea className="textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
						</label>
						<label className="label">
							<span>Negative prompt</span>
							<textarea
								className="textarea"
								value={negativePrompt}
								onChange={(e) => setNegativePrompt(e.target.value)}
							/>
						</label>
						<div className="row">
							<label className="label">
								<span>Checkpoint</span>
								<input className="input" value={ckptName} onChange={(e) => setCkptName(e.target.value)} />
							</label>
							<label className="label">
								<span>Seed (optional)</span>
								<input
									className="input"
									value={seed}
									onChange={(e) => setSeed(e.target.value)}
									placeholder="e.g. 123456"
								/>
							</label>
						</div>
						<label className="label">
							<span>Number of Images</span>
							<input
								className="input"
								type="number"
								min={1}
								max={10}
								value={numImages}
								onChange={(e) => setNumImages(Number(e.target.value))}
							/>
						</label>
						<button className="button" type="submit" disabled={loading}>
							{loading ? 'Generating…' : 'Generate'}
						</button>
						{error && <div className="error">{error}</div>}
					</form>
				</div>

				<div className="card preview">
					<div className="section-title">Output</div>
					{results.map((r, i) => (
						<div key={i} className="output-item">
							{/* Comparison slider */}
							{imageFile && (
								<ReactCompareSlider
									itemOne={<ReactCompareSliderImage src={URL.createObjectURL(imageFile)} alt="Original" />}
									itemTwo={<ReactCompareSliderImage src={r.image} alt={`Generated ${i + 1}`} />}
								/>
							)}

							<div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
								<a className="button" href={r.image} download={`virtual_staging_${i + 1}.png`}>
									Download
								</a>
								{r.file_url && (
									<a className="link" href={r.file_url} target="_blank" rel="noreferrer">
										Open saved file
									</a>
								)}
							</div>
							{r.seed !== undefined && <div className="helper">Seed: {r.seed}</div>}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
