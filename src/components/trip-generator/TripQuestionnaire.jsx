import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Loader2, Home, Pencil } from 'lucide-react';

import ReviewStep from './ReviewStep';
import { buildQuestions, GROUP_TITLES } from './chatQuestions';
import { LogoMark } from '../Logo';
import { useProfile } from '../../hooks/useProfile';
import { hasDetails } from '../../utils/reservations';
import { tripLengthDays, isAllowedTripLength } from '../../../shared/tripLength.js';
import { blankPreferences, formPreferences, normalizePreferences } from '../../../shared/tripPreferences.js';
import { DIETARY_NEEDS, MOBILITY_AND_ACCESS_NEEDS } from '../../../shared/accessibility.js';

const blankCity = () => ({
    name: '', checkIn: '', checkOut: '',
    homebaseType: null,
    hotel: { name: '', address: '' },
    customAddress: '',
    hotelAddressStatus: 'idle',
    customAddressStatus: 'idle',
});

const BLANK_FORM_DATA = {
    country: '',
    cities: [blankCity()],
    travelStyle: '',
    vacationType: '',
    reservations: { flights: [], hotels: [] },
    // The detailed, optional questions (issue #90), all "No preference" to start
    preferences: blankPreferences(),
};

// Saved drafts (and trips retried from the dashboard) may predate some fields
const withDefaults = (formData) => ({ ...formData, preferences: formPreferences(formData.preferences) });

// Everything an itinerary needs: destination, valid dates, a homebase per city and a style
function isComplete(f) {
    const cities = f.cities || [];
    const citiesOk = cities.length > 0 && cities.every((c) => {
        if (!c.name || !c.checkIn || !c.checkOut || c.checkOut <= c.checkIn) return false;
        if (c.homebaseType === 'hotel') return !!(c.hotel?.name && c.hotel?.address && c.hotelAddressStatus === 'valid');
        if (c.homebaseType === 'custom') return !!c.customAddress && c.customAddressStatus === 'valid';
        return c.homebaseType === 'skip';
    });
    return !!f.country && citiesOk && isAllowedTripLength(tripLengthDays(cities)) && !!f.travelStyle && !!f.vacationType;
}

// The review card needs to know whether the detailed questions apply
const REVIEW_STEPS = { quick: [], detailed: [{ id: 'interests' }] };

function BotBubble({ children }) {
    return (
        <div className="flex items-end gap-2">
            <span className="flex h-8 w-8 flex-none items-center justify-center glass-strong rounded-full shadow-sm">
                <LogoMark className="h-5 w-5" />
            </span>
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2.5 text-[15px] leading-relaxed text-slate-800 shadow-sm">
                {children}
            </div>
        </div>
    );
}

function UserBubble({ children, onEdit }) {
    return (
        <div className="flex items-center justify-end gap-1.5">
            {onEdit && (
                <button
                    type="button"
                    onClick={onEdit}
                    aria-label={`Change answer: ${children}`}
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
                >
                    <Pencil size={14} />
                </button>
            )}
            <div className="max-w-[80%] rounded-2xl rounded-br-md bg-aqua-300 px-4 py-2.5 text-[15px] font-medium leading-relaxed text-slate-900 shadow-sm">
                {children}
            </div>
        </div>
    );
}

function Typing() {
    return (
        <BotBubble>
            <span className="flex gap-1 py-1.5" aria-label="TriptAi is typing">
                {[0, 150, 300].map((d) => (
                    <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-brand-300" style={{ animationDelay: `${d}ms` }} />
                ))}
            </span>
        </BotBubble>
    );
}

// The trip questionnaire as a chat (like a messaging app): the assistant asks one question at
// a time, and each answer is a tap on a chip or a small inline card. It fills in the same form
// data the step-by-step form did, so drafts, generation and the review are unchanged.
// `botDelay` (ms) is how long the assistant "types" before each question.
export default function TripQuestionnaire({ onComplete, isGenerating, initialFormData, initialCountry = '', onHome, botDelay = 600 }) {
    const [formData, setFormData] = useState(() =>
        initialFormData ? withDefaults(initialFormData) : { ...BLANK_FORM_DATA, cities: [blankCity()], preferences: blankPreferences(), country: initialCountry }
    );
    // A finished draft (or a trip retried from the dashboard) opens straight on the review
    const [answered, setAnswered] = useState(() =>
        initialFormData && isComplete(withDefaults(initialFormData))
            ? new Set(buildQuestions(withDefaults(initialFormData)).map((q) => q.key).filter((k) => k !== 'review'))
            : new Set()
    );
    // The transcript so far: { type: 'qa', key, group, bot, user } or { type: 'note', text }
    const [log, setLog] = useState([]);
    const [readyKey, setReadyKey] = useState(null);

    const profile = useProfile();
    const savedNeeds = profile.data?.accessibility_needs || [];
    const needs = {
        dietary: savedNeeds.filter((n) => DIETARY_NEEDS.includes(n)),
        mobility: savedNeeds.filter((n) => MOBILITY_AND_ACCESS_NEEDS.includes(n)),
    };

    const questions = useMemo(() => buildQuestions(formData), [formData]);
    const current = questions.find((q) => !answered.has(q.key)) || questions[questions.length - 1];
    // Progress bar: one section per group of questions, filled by how many of its questions are answered
    const progress = useMemo(() => {
        const groups = [];
        const byGroup = {};
        for (const q of questions) {
            if (!byGroup[q.group]) groups.push((byGroup[q.group] = { group: q.group, total: 0, done: 0 }));
            byGroup[q.group].total += 1;
            if (answered.has(q.key)) byGroup[q.group].done += 1;
        }
        return groups;
    }, [questions, answered]);
    const typing = botDelay > 0 && readyKey !== current.key;

    // The assistant "types" for a moment before each new question
    useEffect(() => {
        if (!botDelay) return undefined;
        const t = setTimeout(() => setReadyKey(current.key), botDelay);
        return () => clearTimeout(t);
    }, [current.key, botDelay, log.length]);

    // Keep the newest message in view
    const endRef = useRef(null);
    useEffect(() => {
        endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
    }, [log.length, current.key, typing]);

    const update = (patch) => setFormData((prev) => ({ ...prev, ...patch }));
    const ctx = {
        f: formData,
        needs,
        update,
        patchCity: (i, patch) =>
            setFormData((prev) => ({
                ...prev,
                cities: prev.cities.map((c, j) => (j === i ? { ...c, ...patch, ...(patch.hotel ? { hotel: { ...c.hotel, ...patch.hotel } } : {}) } : c)),
            })),
        setPref: (key, value) => setFormData((prev) => ({ ...prev, preferences: { ...prev.preferences, [key]: { value, noPreference: false } } })),
        skipPref: (key) => setFormData((prev) => ({ ...prev, preferences: { ...prev.preferences, [key]: { ...prev.preferences[key], noPreference: true } } })),
        forget: (predicate) => setAnswered((prev) => new Set([...prev].filter((k) => !predicate(k)))),
        answer: (text) => {
            setLog((prev) => [...prev, { type: 'qa', key: current.key, group: current.group, bot: current.bot(formData, needs), user: text }]);
            setAnswered((prev) => new Set(prev).add(current.key));
        },
    };

    // Ask a whole group of questions again (from the review's Edit, or tapping an answer)
    const editGroup = (group) => {
        const keys = new Set(questions.filter((q) => q.group === group).map((q) => q.key));
        setAnswered((prev) => new Set([...prev].filter((k) => !keys.has(k))));
        setLog((prev) => [...prev, { type: 'note', text: `No problem, let's update ${GROUP_TITLES[group].toLowerCase()}.` }]);
    };

    const handleSubmit = () => {
        // Drop flights that were added but never filled in
        const reservations = { flights: [], hotels: [], ...formData.reservations };
        onComplete({
            ...formData,
            reservations: { ...reservations, flights: reservations.flights.filter(hasDetails) },
            // Only real answers are kept; a Quick plan keeps none
            preferences: normalizePreferences(formData.preferences),
        });
    };

    const onReview = current.key === 'review';
    const reviewText = log.length
        ? "That's everything I need! 🎉 Here's your trip. Tap Edit to change anything, or let's build your itinerary."
        : "Welcome back! 👋 Here's your trip so far. Tap Edit to change anything, or let's build your itinerary.";

    const generateButton = (
        <button
            onClick={handleSubmit}
            disabled={isGenerating}
            className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-base font-bold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
            {isGenerating ? 'Starting…' : 'Generate Itinerary'}
        </button>
    );

    // Gemini-style: logo and title on top, then a bordered frame holding the
    // conversation and, pinned at its bottom, one big rounded box with the answer controls.
    return (
        <div className="relative isolate flex h-[100dvh] overflow-hidden bg-page text-white">
            {/* Sage emerald wave from the top corner, stretched wider than the screen (anchored right)
                so its edge runs gently across the middle */}
            <svg aria-hidden="true" viewBox="0 0 1000 300" preserveAspectRatio="none" className="pointer-events-none absolute right-0 top-0 -z-10 h-[280px] w-[170%] sm:h-[400px]">
                <path d="M0 0 H965 C890 40 810 62 680 66 C540 70 470 52 380 108 C290 165 200 200 0 200 Z" fill="#3b615e" />
            </svg>
            {/* Huge clouds on each side, half off the screen; the left one sits 100px higher than the right */}
            <img
                src="/illustrations/cloud.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-[calc(25%+50px)] -z-10 w-[11rem] -translate-x-1/2 opacity-[0.54] sm:w-[17rem] xl:w-[22rem]"
            />
            <img
                src="/illustrations/cloud.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-[calc(25%+150px)] -z-10 w-[11rem] translate-x-1/2 opacity-[0.54] sm:w-[17rem] xl:w-[22rem]"
            />
            {/* Peach pine trees, one big and one small, in the bottom-left corner (wide screens, beside the chat) */}
            <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-4 -z-10 hidden items-end gap-2 opacity-[0.54] lg:flex xl:left-8 xl:gap-3">
                <img src="/illustrations/pine-tree.png" alt="" className="h-40 w-auto xl:h-64" />
                <img src="/illustrations/pine-tree.png" alt="" className="h-28 w-auto xl:h-44" />
            </div>
        <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-none items-center justify-between gap-3 px-3 pt-3 sm:gap-4 sm:px-6 sm:pt-4">
                <img src="/illustrations/triptai-logo-thin.svg" alt="TriptAi" className="h-8 w-auto sm:h-10" />
                <button
                    onClick={() => onHome(formData)}
                    disabled={isGenerating}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-medium text-white ring-1 ring-white/20 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Home size={16} />
                    Save & exit
                </button>
            </div>

            <div className="flex-none px-4 pb-4 sm:pb-6">
                <h1 className="whitespace-nowrap pt-6 text-center font-[Arial,Helvetica,sans-serif] text-[28px] font-normal leading-none sm:pt-10 sm:text-[52px]">
                    <span className="text-[#2d625e]">Plan <i className="italic">less</i>.</span> <span className="text-[#ffb776]">Go <b className="font-bold">more.</b></span>
                </h1>
            </div>

            {/* Sectioned progress bar floating just above the chat, with the current step below it */}
            <div className="mx-3 mb-3 flex-none sm:mx-auto sm:w-[calc(100%-3rem)] sm:max-w-3xl">
            <div
                role="progressbar"
                aria-label="Trip planning progress"
                aria-valuemin={0}
                aria-valuemax={progress.length}
                aria-valuenow={progress.filter((p) => p.done === p.total).length}
                aria-valuetext={`On ${GROUP_TITLES[current.group]}`}
                className="flex gap-1.5 sm:gap-2"
            >
                {progress.map((p) => (
                    <div
                        key={p.group}
                        title={GROUP_TITLES[p.group]}
                        className={`h-2.5 flex-1 overflow-hidden rounded-full transition-colors ${p.group === current.group ? 'bg-white/30' : 'bg-white/15'}`}
                    >
                        <div className="h-full rounded-full bg-[#ffb776] transition-[width] duration-500 ease-out" style={{ width: `${(p.done / p.total) * 100}%` }} />
                    </div>
                ))}
            </div>
            <p className="pt-2 text-center text-xs text-white/60">{`Planning your trip · ${GROUP_TITLES[current.group]}`}</p>
            </div>

            {/* The chat's bounds: conversation on top, input box at the bottom */}
            <section
                aria-label="Trip planning chat"
                className="mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border-2 border-white/15 sm:mx-auto sm:mb-5 sm:w-[calc(100%-3rem)] sm:max-w-3xl"
            >
            <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-live="polite">
                <div className="space-y-3 px-4 pb-6 pt-5 sm:px-6">

                    {log.map((entry, i) =>
                        entry.type === 'note' ? (
                            <BotBubble key={i}>{entry.text}</BotBubble>
                        ) : (
                            <React.Fragment key={i}>
                                <BotBubble>{entry.bot}</BotBubble>
                                <UserBubble onEdit={isGenerating ? null : () => editGroup(entry.group)}>{entry.user}</UserBubble>
                            </React.Fragment>
                        )
                    )}

                    {typing ? (
                        <Typing />
                    ) : onReview ? (
                        <>
                            <BotBubble>{reviewText}</BotBubble>
                            <div className="glass rounded-3xl p-4 shadow-sm sm:p-6">
                                <ReviewStep formData={formData} steps={REVIEW_STEPS[formData.preferences.planDetail] || []} onEdit={editGroup} />
                            </div>
                        </>
                    ) : (
                        <BotBubble>{current.bot(formData, needs)}</BotBubble>
                    )}
                    <div ref={endRef} />
                </div>
            </main>

            {/* The input box: answer chips and fields for the current question */}
            <div className="flex-none px-2.5 pb-2.5 sm:px-4 sm:pb-4">
                <div className="max-h-[50dvh] w-full overflow-y-auto rounded-[28px] border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-[0_4px_24px_rgba(15,23,42,0.08)] sm:px-5 sm:py-4">
                    {typing ? (
                        <p className="flex min-h-[44px] items-center text-[15px] text-slate-400">TriptAi is typing…</p>
                    ) : onReview ? (
                        generateButton
                    ) : (
                        <div key={`${current.key}-${log.length}`}>{current.render(ctx)}</div>
                    )}
                </div>
            </div>
            </section>

        </div>

        </div>
    );
}
