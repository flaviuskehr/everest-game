---
title: Everest, Together
subtitle: A team expedition. Every vote decides what happens next.
start: intro
---

<!--
FORMAT (see BRIEFING.md section 4):
- Each node starts with:   ## node-id | Short title
- Lines directly below (until the first blank line) are metadata: key: value
    image:  path to a local image          credit: image attribution
    hint:   search hint for finding an image (ignored by the app)
- Then the story text (one or more paragraphs, **bold** and *italic* allowed)
- Then ONE of:
    a question block:   ? Question text
                        A: Label => target-node-id
                        B: Label => target-node-id
    or a single line:   next: target-node-id      (story only, host clicks Continue)
    or a single line:   end: true                 (final node)
-->

## intro | Base camp
image: images/intro-basecamp.jpg
credit: TODO
hint: Everest Base Camp tents with Himalayan peaks, Nepal

The team has decided to climb Mount Everest together. A new guide has joined the rope team, and base camp is today. Every vote decides what happens next. There are no right answers, only different expeditions.

next: d1

## d1 | The first decision
image: images/d1-planning.jpg
credit: TODO
hint: mountaineers studying a map or gear laid out at base camp

Our team decides to climb Mount Everest together. The tents are up, the gear is in front of you, and the weather is clear for now.

? Would you rather plan ahead or improvise?
A: Plan ahead => d2a
B: Improvise => d2b

## d2a | A bear on the ridge
image: images/d2a-ridge-bear.jpg
credit: TODO
hint: Himalayan black bear or brown bear on a rocky mountain ridge

The team planned well: gear is sorted, routes are marked, and weather windows are checked. You reach the halfway mark in record time. Then something nobody planned for happens: a bear appears on the ridge.

? Would you rather send the two strongest people to deal with it, or send the whole team together?
A: Two strongest people => d3aa
B: The whole team => d3ab

## d2b | Darkness falls
image: images/d2b-dusk.jpg
credit: TODO
hint: mountain slope at dusk or night with a single headlamp

You set off without a fixed plan and make good progress on day one. Then darkness falls, and nobody packed for it.

? Would you rather send two people back to base camp for flashlights, or keep the whole team walking in the dark?
A: Two people return for flashlights => d3ba
B: Everyone walks on => d3bb

## d3aa | The tired heroes
image: images/d3aa-exhausted.jpg
credit: TODO
hint: two tired climbers resting in the snow

The two scare the bear away and come back as heroes, but they are clearly exhausted. They say they are fine.

? Would you rather ask them directly to rest, or trust them to say when they need a break?
A: Ask them to rest => b-aa-rest
B: Trust them => b-aa-trust

## d3ab | Scattered gear
image: images/d3ab-gear.jpg
credit: TODO
hint: climbing equipment scattered on a snow slope

The bear flees from the noise, but equipment is scattered over the slope and everyone has a different version of what happened.

? Would you rather stop for a structured debrief and re-pack now, or keep climbing and sort it out on the way?
A: Debrief and re-pack now => b-ab-debrief
B: Keep climbing => b-ab-go

## d3ba | Waiting in the cold
image: images/d3ba-waiting.jpg
credit: TODO
hint: group of climbers waiting in tents or around a stove at night in the mountains

The two bring back lights and a rough weather note, but it takes two hours. The rest of the team waits in the cold with one open question: which route to take after the night?

? Would you rather brainstorm the route together, live, or think alone first and then compare notes?
A: Brainstorm together => b-ba-brain
B: Think alone first => b-ba-alone

## d3bb | The old logbook
image: images/d3bb-logbook.jpg
credit: TODO
hint: stone cairn with prayer flags or an old notebook on a mountain trail

You keep moving, slowly. In the beam of a single headlamp, you find a cairn with a weathered logbook left by an earlier expedition.

? Would you rather stop and read it carefully together, or try things out and learn as you go?
A: Read it together => b-bb-read
B: Learn as you go => b-bb-learn

## b-aa-rest | A short rest
image: images/b-rest.jpg
credit: TODO
hint: climbers sharing a break with a thermos on a ridge

The heroes grumble but rest, and the team shares their load. You lose an hour, but everyone arrives at the ridge in one piece.

next: d4p

## b-aa-trust | Eyes front
image: images/b-trust.jpg
credit: TODO
hint: climber leading a rope team up a snowy slope

They stay in the lead and morale soars, but one of them has been hiding a sprained ankle. The group slows down on the final stretch.

next: d4p

## b-ab-debrief | The camp meeting
image: images/b-debrief.jpg
credit: TODO
hint: climbers sitting in a circle repacking gear at camp

The debrief takes an hour. You come out with a shared picture, a repacked sled, and a rule for the next surprise.

next: d4p

## b-ab-go | Momentum
image: images/b-go.jpg
credit: TODO
hint: line of climbers moving up a snow ridge

You gain time and momentum. Half the gear is found on the way, the other half is declared "optional".

next: d4p

## b-ba-brain | Loud, but aligned
image: images/b-brain.jpg
credit: TODO
hint: group of mountaineers discussing around a map

Three ideas appear in ten minutes, and the team agrees on one route. It is a bit loud, but nobody feels left out.

next: d4i

## b-ba-alone | Maps at dawn
image: images/b-alone.jpg
credit: TODO
hint: lone climber at sunrise on a mountain, looking at a map

You compare notes at dawn. The combined map has a route nobody would have proposed in a group discussion.

next: d4i

## b-bb-read | Time well spent
image: images/b-read.jpg
credit: TODO
hint: climbers reading a notebook by headlamp

It takes time, but the logbook marks two dangerous crevasses and one hidden shelter. You arrive prepared.

next: d4i

## b-bb-learn | Learning the hard way
image: images/b-learn.jpg
credit: TODO
hint: crevasse in a glacier with a climber at the edge

You find the shelter by accident and one crevasse by falling into it, gently. The team learns fast and remembers it.

next: d4i

## d4p | The summit ridge
image: images/d4-ridge.jpg
credit: TODO
hint: Everest summit ridge with Hillary Step, sunrise

The summit is in sight. Thanks to careful planning, the team has energy left. There are two ways up.

? Would you rather stay on the well-trodden route that everyone knows, or take an unmapped pass nobody has tried?
A: The known route => end-plan-known
B: The new pass => end-plan-new

## d4i | The summit ridge
image: images/d4-ridge.jpg
credit: TODO
hint: Everest summit ridge with Hillary Step, sunrise

The summit is in sight. The team has improvised its way here and has a lot of stories to show for it. There are two ways up.

? Would you rather stay on the well-trodden route that everyone knows, or take an unmapped pass nobody has tried?
A: The known route => end-improv-known
B: The new pass => end-improv-new

## end-plan-known | The Textbook Summit
image: images/end-summit.jpg
credit: TODO
hint: climbers on the summit of Mount Everest with flags

The team reaches the top on schedule, calmly and in formation. The open question is where the next summit comes from.

Base camp is set. The route is a draft, and the real expedition starts with the first agenda item.

end: true

## end-plan-new | The Prepared Pioneers
image: images/end-summit.jpg
credit: TODO
hint: climbers on the summit of Mount Everest with flags

Thorough preparation meets an unknown route. The team plants a flag and a plan for others to follow.

Base camp is set. The route is a draft, and the real expedition starts with the first agenda item.

end: true

## end-improv-known | The Seasoned Scramblers
image: images/end-summit.jpg
credit: TODO
hint: climbers on the summit of Mount Everest with flags

No fixed plan, but plenty of instinct. The team reaches the top by the safest of improvised routes and has a good story for every ledge.

Base camp is set. The route is a draft, and the real expedition starts with the first agenda item.

end: true

## end-improv-new | The Pathfinders
image: images/end-summit.jpg
credit: TODO
hint: climbers on the summit of Mount Everest with flags

Nobody had a map, so the team drew one. The route is new, a bit crooked, and entirely theirs.

Base camp is set. The route is a draft, and the real expedition starts with the first agenda item.

end: true
