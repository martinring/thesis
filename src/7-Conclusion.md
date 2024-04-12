# Conclusion {#chap:conclusion}

This thesis, has elaborated on self-verification — systems which are not 
verified a priori, during the design phase, but where the proof obligations 
incurred during the development are postponed until after deployment, and are 
proven at run-time. This makes proofs easier, as we can instantiate a number 
of the parameters of the system which are unknown at design time but become 
known at run-time. This reduces the state space, turning the exponential growth 
of the state space — the bane of model-checking — into exponential reduction. 
Self-verification is supported by a tool chain we have developed, which allows 
specification in SysML/OCL, system modelling in Clash, and verification using 
SMT provers and SAT checkers.

Despite the use of specific modelling languages and prover tools in our 
evaluation, the basic idea is independent of these. As long as we can translate 
the verification conditions into a format where we can track the variables to be 
instantiated into run-time, and which is suitable to automatic proof, the 
approach is viable and competitive, because of the exponential reduction of the 
search space.

We have investigated the implications, self-verification has on the development
and were able to establish a core set of development rules regarding the 
applicability of the approach as well as design decisions that should be made:

- Self-verification is especially well suited for systems, that may sacrifice 
  availability for safety. This explicitly excludes fail-safe systems but 
  nevertheless includes a large portion of application domains.
- Proof obligations should be discharged as early as possible but as late as 
  needed. For this a minimal set of *trigger transitions* should be selected, 
  which defines the transitions of the system that initiate a verification task.
- Trigger transitions must not themselves be safety critical: the non-execution 
  or delay of a trigger transition should never violate the specification --- if 
  we verify our parachute upon pulling the release cord it is clearly too late 
  to handle failure.
- Trigger transitions should maximise the reduction in prover run time. A 
  trigger transition which does not significantly reduce the verification run time,
  may as well be left as a normal transition.

For the latter point, we have developed a methodology which can indicate which
sets of variables of a proof offer the largest reduction in verification run 
time[, a]{.changed}iding the designer in this decision. We demonstrated the 
practical application of the methodology through a proof-of-concept 
implementation and extensive experimental evaluation, offering a novel 
perspective on managing computational resources in post-deployment verification 
tasks, emphasizing the strategic fixation of variables to balance verification 
coverage and computational efficiency.

Note that self-verification is not meant to *replace* the existing verification
flow but rather *enhances* it. We should by all means use all well-known
powerful tools at design time to discharge verification conditions as before.
However, self-verification offers a different way to tackle proof obligations
which cannot be shown at design time, supplementing design time verification,
and offering the designer to pick the best of all possible worlds.

## Contributions {.added}

This cumulative thesis offers significant contributions to the field of embedded 
system verification that span conceptual frameworks, methodological 
advancements, and empirical validations:
{.added}

[#chap:selfie] delved into the fundamentals of self-verification, 
presenting a novel design and verification methodology that defers a portion of 
the verification process until after deployment. This methodology leverages the 
specific operating context of systems to reduce the complexity of verification 
tasks. Several case studies, based on an implementation that uses a lightweight 
SAT solver not only validate the proposed methodology but also demonstrate its 
practical applicability and effectiveness.
{.added}

[#chap:timing] further explores the application of self-verification within the 
system development lifecycle, specifically through the lens of design time 
verification, run-time verification, and their relationship with 
self-verification. By classifying system transitions and optimizing 
verification efforts, the chapter presents a nuanced model that enhances system 
safety and flexibility without compromising on functionality. A detailed case 
study on an access control system exemplifies the real-world applicability of 
self-verification, providing methodological insights.
{.added}

[#chap:partitioning] presents a novel approach to determining the optimal number
and selection of variables to be fixed for verification tasks, employing
evolutionary algorithms. The effectiveness of this methodology is confirmed by
experimental evaluations, which demonstrate significant reductions in
verification run times over random variable selections. It goes beyond the
capabilities of established decision heuristics as it considers the real
runtimes of proofs for sets of variables.
{.added}

Together, this thesis contributes a comprehensive framework for 
self-verification that encompasses conceptual foundations, practical 
implementation strategies, and empirical validations. It proposes innovative 
methodologies and tools for optimizing verification processes, and validates 
these approaches through extensive evaluations. These contributions mark a 
significant step forward in the design, verification, and maintenance of 
ebedded systems, with the potential to have a lasting impact on the field.
{.added}

## Future Work {.added}

The idea of self-verification opens up numerous possiblities for future work,
which did not fit the scope of this thesis:
{.added}

More thorough empirical studies and real-world deployments of self-verification
methodologies would provide valuable insights into their practicality and 
effectiveness. This includes conducting large-scale evaluations across diverse 
application domains, from critical infrastructure to consumer electronics, to 
assess the adaptability and resilience of self-verification-enabled systems. 
Such studies would not only validate theoretical models and simulation results 
but also identify practical challenges and opportunities for refinement.
{.added}

To leverage the concept even further, it would be highly beneficial to implement 
the verification engines as dedicated hardware components, maybe even 
specifically tailored for the concrete proof instances. 
{.added}

A natural progression from the foundational work laid out in this thesis is the
exploration of more sophisticated self-verification frameworks that can
dynamically adjust to changing operational contexts and system states (as
outlined in [#chap:advanced]). This involves developing adaptive algorithms that
can not only verify but also optimise system configurations in real-time,
enhancing system reliability and performance without human intervention.
Research could focus on creating models that predict configuration changes and
assess their impact on system behavior, ensuring that self-verification
processes remain efficient and effective under varying conditions. {.added}

Furthermore, the exploration of decentralised self-verification approaches for
distributed systems offers significant potential. In environments where systems
consist of multiple interacting components, such as in the Internet of Things
(IoT) or distributed ledger technologies, traditional centralised verification
approaches as illuminated in this thesis may not be feasible. Research could
focus on developing distributed self-verification protocols that allow
individual components to independently verify their operation while contributing
to the overall system's integrity. This would require novel consensus mechanisms
and trust models to ensure that verification processes are reliable and
tamper-resistant. 
{.added}

## Conclusion {.added}

Despite the required future research, the evaluations and discussions in this
thesis show that, following the proposed ideas, allows for a novel verification
methodology that can be adapted today, which does not rely on incremental
improvement of existing tools and methods but tackles complexity from a
completely different angle. While self-verification offers immense potential, it
also comes with challenges and limitations that must be addressed in the future.
Balancing optimism with a realistic evaluation of these challenges, further
research as well as collaborative efforts between academia and industry are
necessary to find the sweet spots in delaying of verification tasks. This will
be crucial in advancing self-verification, pushing the boundaries of systems
reliability, safety, and efficiency in an increasingly automated world.
{.changed}