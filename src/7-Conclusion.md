# Conclusion {#chap:conclusion}

This thesis has elaborated on self-verification — systems which are not 
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
time, aiding the designer in this decision.

Note that self-verification is not meant to *replace* the existing verification
flow but rather *enhances* it. We should by all means use all well-known
powerful tools at design time to discharge verification conditions as before.
However, self-verification offers a different way to tackle proof obligations
which cannot be shown at design time, supplementing design time verification,
and offering the designer to pick the best of all possible worlds.

The idea of self-verification opens up numerous possiblities for future work (as
outlined in [#chap:advanced]), which did not fit the scope of this thesis.
However, the evaluations and discussions show that, following the proposed idea,
allows for a novel verification methodology that can be adapted today, which
does not rely on incremental improvement of existing tools and methods but
tackles complexity from a completely different angle. While self-verification
offers immense potential, it also comes with challenges and limitations that
must be addressed. Balancing optimism with a realistic evaluation of these
challenges, further research as well as collaborative efforts between academia
and industry are necessary. This will be crucial in advancing self-verification,
pushing the boundaries of systems reliability, safety, and efficiency in an
increasingly automated world.
{.changed}