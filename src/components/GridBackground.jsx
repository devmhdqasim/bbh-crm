import React from 'react';

export default function GridBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            {/* Cinematic ambient glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(222,164,2,0.06),transparent_60%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_80%_50%,rgba(74,16,21,0.3),transparent_60%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_20%_80%,rgba(55,9,11,0.4),transparent_60%)]"></div>
            {/* Subtle noise texture via very faint grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(222,164,2,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(222,164,2,0.015)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        </div>
    );
}
