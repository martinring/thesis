# The Future of [Self-Verification]{.nobr} {#chap:advanced}

Self-Verification is an entirely new approach to the verification of 
cyber-physical and embedded systems and opens up its own field of potential 
research directions. We present four promising ideas in this chapter.

## Predictive Self-Verification {#sec:predictive-verification}

If neither safety nor functionality can be sacrificed, whenever a trigger 
transition is reached during the run-time of a system, the system must pause
until it is proven safe to operate again (See also [#sec:practical-exploitation]). 
This may lead to unacceptable delays in the execution. One possible remedy could 
be to utilise the idle-time of the proof system to proactively prove possible 
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
of the other road users, etc. It becomes clear that this direction is by no 
means a venture that can be easily taken. Not because these methods do not exist,
but because complex techniques from numerous scientific disciplines have to be 
combined. However, even rudimentary approaches can give us a benefit. We utilise 
"free" idle time between trigger transitions and every *hit* will improve the 
responsivenes of the sytem.

Even with a suitable method of prediction, problem [#enum:cache], caching of discharged 
proofs, remains. We are working with huge state spaces (recall, that they were 
too large to handle prior to deployment) and over time, an arbitrarily large 
amount of discharged proofs may accumulate (by this, too large to keep in memory). 
There are two ideas to cope with this (which may be combined):

1. We may employ "garbage collection" which clears proofs for states that were 
   predicted under entirely different conditions [but]{.changed} stayed unused.
2. Proof results could be condensed by proving patterns of states and storing 
   only the pattern.

Overall, predictive verification is a promising approach to increase the 
availability and responsiveness of self-verifying systems.

## Just-in-Time Verification {#sec:jit}

So far, we have worked with statically assigned trigger transitions such as a 
change of the configuration or an environment variable. If these variables are 
under the control of the system this allows for a completely safe system while 
we might sacrifice some functionality (when a proof fails) or have to accept 
delays (when a proof consumes more time than predicted). However, variables that 
are externally controlled might leave the system unverified for a period of time 
or even proven erroneous during execution. For instance, a self-driving car may
encounter unexpected road conditions, traffic signals, or pedestrians that 
require immediate verification of its safety and functionality. In such cases, 
waiting for a correctness proof to complete before resuing the execution may not
be feasible or desirable. In addition, verifiying properties of the system over
general unbounded time intervals may be undecidable or intractable, as it often
involves checking properties over infinite non-conflatable state spaces.
{.changed}

As a remedy for these shortcomings, we propose a novel approach called
*just-in-time verification*, which dynamically triggers *time-bounded
verifications* during run-time of the system. Time-bounded verification is a
method of checking the correctness of real-time systems over time intervals of
fixed, bounded length. It is useful for verifying properties that are relevant
only for a certain duration, such as deadlines, timeouts, or response times.
However, in our use-case time-bounded verification can also be a means to avoid
some of the undecidability and complexity issues of unbounded verification
[@TimeBoundedVerification]. Time-bounded verification can be applied to various
logics and models of real time, such as timed automata, metric temporal logic,
event-clock automata, and perturbed timed automata. It can also be combined with
other techniques, such as partial-order reduction, preemption locks, and
priority locks, to improve the efficiency and scalability of the verification
process. [@TimeBoundedVerification,@TimeBoundedVerificationTheory]
{.added}

The idea of just-in-time verification is to monitor the system state and the
environment variables continuously, and to repeatedly conduct time-bounded
verifications. The verification is performed over a time interval that is
sufficient to ensure the correctness of the system for a time span long enought 
to finish the proof of the next time period. If the verification succeeds, the 
system can proceed with the execution. If the verification fails, the system can
fall-back to a safety measure.
{.added}

### Prerequisites

Just-in-time verification imposes two essential requirements that have to be met 
during the design of the system:

The central requirement is the existence of a *safety measure* that can be 
executed in any state of the system and bring the system into a stable safe 
state. E.g. for a vehicle this might be pulling over and coming to a safe stop 
or requesting human intervention. The time $t_\text{safe}$ it takes to execute 
this safety measure may be dynamically dependent on the state of the system 
(e.g. the speed of a vehicle) but it (or its upper bound) must be predictable 
from any given state.
{.changed}

In addition, we need a heuristic $\eta(t,\sigma)$ that gives us a conservative 
estimate of the timespan we can prove from the current state $\sigma$ of the 
system into the future, given the available proof time $t$. The results of 
[#chap:partitioning] indicate that such a heuristic could be inferrable. 
The recent dramatic advances in machine learning, especially deep neural 
networks, offer another encouragement to investigate this. Even a very basic 
heuristic will never leave the system in an unsafe state, but might cause 
inconvenience, as the system will trigger unnecessary emergency stops (i.e. the 
safety measure).

### Operation

For its operation a just-in-time verified system has to be equipped with a
self-verification system, composed of a monitor, a verifier and a controller. 
The self-verification system is responsible for verifying the system dynamically
during operation, as well as for adapting the system behavior accordingly.
{.added}

The *monitor* component observes the state of the system and the 
environment. The monitor can be implemented e.g. with 
sensors, event logs or access to internal state of the deployed system. The 
monitor communicates the information to the *verifier* component, which 
runs the verification tasks of the system using time-bounded verification. The 
verifier can e.g. utilise an SMT-solver or model checker. The verification 
results are communicated to the *controller*, which has the power to trigger the 
safety measure at any time of the system execution, as well as resume normal 
execution of the system.
{.added}

After the system is deployed or when the safety measure has been triggered, the 
proof system has to be bootstrapped by proving a timespan $t_0$ which ends at 
$\dashv_{t_0}$. When this is successful, the controller can can start or resume 
the normal operation of the system. During operation, the proof engine will 
continuously trigger proofs in a loop follwing the schema:
{.added}

1. the proof for [time span]{.added} $t_{n-1}$ completes.   
2. we trigger a proof for [time span]{.added} $t_n$ with $\dashv_{t_n} > \dashv_{t_n-1} + t_\text{safe}$. 
   The proof itself consumes the timespan $t_n^\text{proof}$. $t_n$ is 
   determined by our heuristic $\eta$.
3. when the proof completes before $\dashv_{t_n} - t_\text{safe}$ we [can]{.added}
   continue from (1) ([#fig:jit-1]). [This is the the stable just-in-time proof 
   cycle.]{.added}
4. when verifier proves the violation of a property or does not yield a proof 
   result in time (i.e. before $\dashv_{t_n} - t_\text{safe}$) the controller 
   interrupts the proof cycle by executing the safety measure. 
   ([#fig:jit-2], [#fig:jit-3])
   {.changed}
5. when the system reaches a safe state after execution of the safety measure,
   the verifier can bootstrap the proof cycle again and start from (1)
   {.changed}

![The ideal jit scenario: . $t_{n-1}$ is the timespan 
that was previously verified. In this ideal 
scenario $t_n^\text{proof}$ ends before the end of 
$\dashv_{t_{n-1}} - \left|t_\text{safe}\right|$. Operation can continue and 
the next proof ($n+1$) is triggered.](jit-1.svg){#fig:jit-1 width=67%}

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
   system[?]{.changed}
2. Are there real-world systems to which just-in-time verification can be 
   applied without severely restricting functionality[?]{.changed}

We have implemented experiments, namely a simplified simulation of an
adaptive cruise control and several planning algorithms but until now failed to 
find the sweet spot, where a stable proof cycle can be permanently established
while also verifying interesting properties and operating in real time. However, 
we still believe, that it is worth investigating further [as just-in-time 
verification has several advantages over the static trigger-based approach:]{.added}

1. It can ensure safety even in the presence of uncertain and unpredictable
   environments.
   {.added}
2. It can drastically reduce the verification overhead and the execution delay
   by focusing on the relevant scenarios and properties.
   {.added}
3. It can increase the availability and responsiveness of the system by avoiding 
   unnecessary delays due to long running verification tasks.
   {.added}
4. It could enable the evolution and integration of the system by allowing the 
   verification of new components.
   {.added}

## Dependent Operation {#sec:dependent-operation}

In the context of just-in-time verification, we propose *Dependent Operation* 
as a critical concept, that may aid in establishing a stable proof cycle. 
Particularly for systems where operational parameters directly influence the 
verification process or the safety measure. This is exemplified by an autonomous 
vehicle:
{.changed}

- The speed of an autonomous vehicle is proportional to the time it takes to 
  bring the vehicle to a safe stop (i.e. $t_{safe}$ reduces).
  {.added}
- The speed of an autonomous vehicle also exponentially reduces the search space
  of time-bounded veficiation tasks as the surface of potential positions of the 
  vehicle within the relevant time interval shrinks. (i.e. verification time reduces)
  {.added}


This observation could be the key to practically applicable just-in-time 
verification: The system adapts its operation to the proof system and vice 
versa. By this, both system availability and safety can be maximised 
dynamically.
{.added}

A continuous feedback loop is integral to this process. It involves real-time
monitoring of both the system's state and the environment. Adjustments to
operational parameters are based on this ongoing assessment. However,
implementing Dependent Operation poses several challenges: 
{.added}

1. Real-time Data Analysis: The system must efficiently process and analyze data
   in real-time to make informed adjustments. This requires advanced algorithms
   capable of quick and accurate decision-making.
   {.added}
2. Predictive Accuracy: The system's ability to predict the implications of
   parameter adjustments on verification outcomes is crucial. Ensuring the
   accuracy of these predictions is paramount, particularly in safety-critical
   scenarios.
   {.added}
3. Balancing Safety and Operational Efficiency: It is vital to strike a balance
   between maintaining operational efficiency and ensuring safety. Overly
   conservative adjustments might hinder system performance, while aggressive
   adjustments could compromise safety.
   {.added}

The application of dependent operation holds significant promise in enhancing 
both the safety and efficiency of complex, real-time systems. Its adaptability 
makes it suitable for a wide range of applications beyond autonomous vehicles, 
including industrial automation and smart infrastructure management.
{.added}
 
## Verification Aware Inference

Inferred systems or components of systems, which are the result of modern 
machine learning approaches (e.g. deep neural networks) are usually black boxes 
for verification methods. Their quality assurance usually focuses on the training 
inputs. There are several first attempts to the verification of such trained 
models [@Narodytska2018;@Sun2019]. However, they share the problem of 
non-scalability. [With the recent advent of transformer models, it seams feasible
to train models not to produce continuous single decisions based on the current 
state but instead repeatedly update the actual plan or code that is suitable to 
handle the current situation of the system based on the observation of the 
environment.]{.added}

If we take into account the observations from [#sec:dependent-operation], that
controllable variables can not only have an effect on $t_\text{safe}$ but also
on the search space, we can imagine an inferred system that is optimised to
produce plans that not only serve to perform their primary tasks but also reduce
verification time, so that it becomes feasible to establish a proof cycle as
outlined in [#sec:jit]. Transformer models respond very well to feedback (e.g.
Reinforcement learning from human feedback) and by this might be optimisable to
produce plans that are easy to verify, by using the verification time (and
result) as basis for feedback to the transformer model. For complex systems with
(for humans) impenetrable inter-dependencies this might well be the only way to
establish dependent operation at all. {.changed}

## Conclusion {.added}

In this chapter, we have explored potential future directions of
Self-Verification in cyber-physical and embedded systems, highlighting
innovative approaches like Predictive Self-Verification, Just-in-Time
Verification, Dependent Operation, and Verification Aware Inference. 
{.added}

The presented concepts relate to the principles of any-time algorithms 
[@AnyTimeAlgorithms], as they offer valid outputs even if interrupted and the 
quality of the response increases with the available computation time. However,
we believe that just-in-time verification may be a simpler concept that allows 
for a clearer devision of implementation and verification as the verification 
system can be integrated in a late phase of the development, while any-time 
algorithms impose increased development costs in the early implementation phase.
{.added}

The exploration of Self-Verification in this chapter could represent a
significant shift in how we approach the verification of complex systems in the
future, moving towards more dynamic and responsive methodologies. This is in 
response to the increasing complexity and autonomy of contemporary
systems but also an acknowledgment of the need for adaptive verification 
strategies. The concepts and methodologies discussed are also indicative of a 
broader movement towards seamlessly embedding verification into system 
operation.
{.added}