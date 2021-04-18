# The Future of [Self-Verification]{.nobr} {#chap:advanced}

Self-Verification is an entirely new approach to the verification of 
cyber-physical and embedded systems and opens up its own field of potential 
research directions. We present four promising ideas in this chapter.

## Predictive Self-Verification {#sec:predictive-verification}

If neither safety nor functionality can be sacrificed, whenever a trigger 
transition is reached during the run-time of a system, the system must pause
until it is proven safe to operate again (See also [#sec:practical-exploitation]). 
This may lead to unacceptable delays in the execution. One possible remedy could 
be to utilize the idle-time of the proof system to proactively prove possible 
future trigger transitions. However, this imposes a couple of hard problems:

1. We need a method to predict future transitions and
2. we need to cache discharged proofs. {#enum:cache}

The prediction of future transitions in cyber-physical systems is completely
dependent on the scope of the system and may involve arbitrary scientific 
disciplines, as such systems interact with the physical world. Assume a 
self-driving vehicle as an example: We may use meteorologic information to 
predict the static and adhesive friction of the road due to rain, ice and wind
conditions. We might use statistical traffic data for the prediction of traffic 
jams, psychological approaches to intention recognition to predict the behaviour
of the other road users, etc. It becomes clear, that this direction is by no 
means a venture that can be easily taken. Not because these methods do not exist,
but because complex techniques from numerous scientific disciplines have to be 
combined. However, even rudimentary approaches can give us a benefit. We utilize 
"free" idle time between trigger transitions and every *hit* will improve the 
responsivenes of the sytem.

Even with a suitable method of prediction, problem [#enum:cache], caching of discharged 
proofs, remains. We are working with huge state spaces (recall, that they were 
too large to handle prior to deployment) and over time, an arbitrarily large 
amount of discharged proofs may accumulate (by this, too large to keep in memory). 
There are two ideas to cope with this (which may be combined):

1. We may employ "garbage collection" which clears proofs for states, that were 
   predicted under entirely different conditions and stayed unused.
2. Proof results could be condensed by proving patterns of states and storing 
   only the pattern.

Overall, predictive verification is a promising approach to increase the 
availability and responsiveness of self-verifying systems.

## Just-in-Time Verification {#sec:jit}

So far we have worked with statically assigned trigger transitions such as a 
change of the configuration or an environment variable. If these variables are 
under the control of the system this allows for a completely safe system while 
we might sacrifice some functionality (when a proof fails) or have to accept 
delays (when a proof consumes more time than predicted). However, variables that 
are externally controlled might leave the system unverified for a period of time 
or even prooven errorneous during execution. *Just-in-time verificataion* can be 
a remedy for these shortcomings by dynamically triggering *time-bounded 
verifications* during run-time keeping the system safe in spite of externally 
controlled variables.

Time-bounded verification is a variation of model checking on timed automata 
which describes a verification methodology where instead of checking the 
complete correctness of a system we only verify a certain target time span into 
the future. We start from an initial state and explore every possible trace up 
to the point where the consumed time is larger than the target time span. In 
contrast to full model-checking, time-bounded verification is both decidable and 
EXPSPACE-Complete instead of undecidable and NP-Complete [@TimeBoundedVerification].

### Prerequesites

Just-in-time verification imposes two essential requirements that have to be met 
during the design of the system.

The central requirement is the existence of a *safety measure* that can be 
executed in any state of the system and bring the system into a stable safe 
state. E.g. for a vehicle this might be pulling over and coming to a safe stop. 
The time $t_\text{safe}$ it takes to execute this safety measure may be 
dynamically dependent on the state of the system (e.g. the speed of a vehicle) 
but it (or its upper bound) must be safely predictable.

In addition, we need a heuristic $\eta(t,\sigma)$ that gives us a conservative 
estimate of the timespan we can prove from the current state $\sigma$ of the 
system into the future, given the available proof time $t$. The results of 
[#chap:partitioning] indicate that such a heuristic could be inferrable. 
The recent dramatic advances in machine learning, especially neural networks, 
offer another encouragement to investigate this. Even a very basic heuristic 
will never leave the system in an unsafe state, but might cause inconvenience, 
as the system will trigger unnecessary emergency stops (i.e. the safety 
measure).

### Operation

After the system is deployed, the proof system is bootstrapped by proving a 
timespan $t_0$ which ends at $\dashv_{t_0}$. When this is done, the system can 
start operating. During operation, the proof engine will continuously trigger 
proofs after the following schema:

![The ideal jit scenario: . $t_{n-1}$ is the timespan 
that was previously verified. In this ideal 
scenario $t_n^\text{proof}$ ends before the end of 
$\dashv_{t_{n-1}} - \left|t_\text{safe}\right|$. Operation can continue and 
the next proof ($n+1$) is triggered.](jit-1.svg){#fig:jit-1 width=67%}

1. the proof for $t_{n-1}$ completes.
2. we trigger a proof for $t_n$ with $\dashv_{t_n} > \dashv_{t_n-1} + t_\text{safe}$. 
   The proof itself consumes the timespan $t_n^\text{proof}$. $t_n$ is 
   determined by our heuristic $\eta$.
3. when the proof completes before $\dashv_{t_n} - t_\text{safe}$ we continue from
   (1) ([#fig:jit-1]).
4. when the proof fails or does not complete in time we exit the proof cycle by 
   executing our safety measure. ([#fig:jit-2], [#fig:jit-3])
5. when we reached a safe state, we can try to restart the system, by 
   bootstrapping again and start from (1)

![Reasons to exit the proof cycle: an error is detected before 
$t_{n-1} - \left|t_\text{safe}\right|$. The system starts the emergency measure
just in time](jit-2.svg){#fig:jit-2 width=67%}

![Reasons to exit the proof cycle: the proof does not complete before 
$t_{n-1} - \left|t_\text{safe}\right|$, hence the result will not be usable even 
if proven correct. The system starts the emergency measures just in 
time](jit-3.svg){#fig:jit-3 width=67%}

The proof cycle is always safe, but can in the worst case restrict functionality
of the system completely if the heuristic $\eta$ always overestimates the time 
$t$ that can be proven or the proof is never faster than the execution. Hence, 
the unanswered research questions that arises from this approach are:

1. Is there a reliable method to infer a "good enough" $\eta$ for a given 
   system.
2. Are there real-world systems to which just-in-time verification can be 
   applied without severely restricting functionality.

We have implemented experiments, namely a simplified simulation of an
adaptive cruise control and several planning algorithms but until now failed to 
find the sweet spot, where a stable proof cycle can be permanently established
while also verifying interesting properties and operating in real time. However, 
we still believe, that it is worth investigating further.

## Dependent Operation {#sec:dependent-operation}

Just-in-time verification could allow for a tight feedback loop between 
operation and verification. Consider an autonomous vehicle as an example: If 
$t_\text{safe}$ depends on a controllable variable (e.g. the velocity of the 
vehicle has an influence on the time it takes to bring the vehicle to a stop 
$t=\frac{v}{a}$), we have the power to actively control $t_\text{safe}$. If we 
cannot establish a stable proof cycle, a possible remedy could be to 
actively lower $t_\text{safe}$, i.e. reduce the velocity of the vehicle. 

On the other hand we might be able to control variables that can reliably reduce
the seach space, e.g. again, the velocity of a vehicle has an influence on the 
area containing the possible future positions of the vehicle. 

By this, the reduction of velocity linearly increases the available proof time 
while also reducing the search space of the proof exponentially. This 
observation could well be the key to practically applicable just-in-time 
verification: The system adapts it's operation to the proof system and vice 
versa. Both system availability and safety can me maximised dynamically.

## Verification Aware Inference

Inferred systems or components of sytems, which are the result of modern 
machine learning approaches (e.g. deep neural networks) are usually black boxes 
for verification methods. Their quality assurance usually focuses on the traning 
inputs. There are several first attempts to the verification of such trained 
models [@Narodytska2018;@Sun2019]. However, they share the problem of non-scalability.

However, if we take into account the observations from
[#sec:dependent-operation], that controllable variables can not only have an effect on $t_\text{safe}$ but also on the search space, we can imagine an inferred system that is optimized not only to perform it's primary tasks but also reduce verification time so drastically, that it becomes feasible in spite of the scalability issues. For complex systems with (for humans) impenetrable inter-dependencies this might well be the only way to establish dependent operation.