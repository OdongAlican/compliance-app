/**
 * StepIndicator — multi-step form progress bar.
 * Replaces the duplicated step indicator in every multi-section form.
 *
 * Props:
 *   steps          string[]    — array of step labels
 *   currentStep    number      — 0-based index of the active step
 */
import React from 'react';

export default function StepIndicator({ steps = [], currentStep = 0 }) {
    return (
        <div className="flex items-center justify-between px-2 mb-6">
            {steps.map((label, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                    <React.Fragment key={index}>
                        <div className="flex flex-col items-center text-center" style={{ flex: 1 }}>
                            <div
                                className="w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm mb-1"
                                style={
                                    isCompleted
                                        ? { background: 'var(--success)', color: '#fff' }
                                        : isCurrent
                                            ? { background: 'var(--accent)', color: '#fff' }
                                            : { background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                                }
                            >
                                {isCompleted ? '✓' : index + 1}
                            </div>
                            <span
                                className="text-xs font-semibold"
                                style={{
                                    color: isCurrent ? 'var(--accent)' : isCompleted ? 'var(--success)' : 'var(--text-muted)',
                                }}
                            >
                                {label}
                            </span>
                        </div>

                        {/* Connector line */}
                        {index < steps.length - 1 && (
                            <div
                                className="h-px flex-1 mx-1"
                                style={{ background: index < currentStep ? 'var(--success)' : 'var(--border)' }}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
