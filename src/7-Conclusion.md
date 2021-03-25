# Conclusion

This paper has elaborated on earlier proposals of self-verification ---
systems which are not verified \emph{a priori}, during the design phase,
but where the proof obligations incurred during the development are
postponed until after deployment, and are proven at runtime. This makes
proofs more easy, as we can instantiate a number of the parameters of the
system which are unknown at design time, but become known at runtime. This
reduces the state space, turning the exponential growth of the state space
--- the bane of model-checking --- into exponential
reduction. Self-verification is supported by a tool chain we have developed,
which allows specification in SysML/OCL, system modelling in C$\lambda$aSH, and
verification using SMT provers and SAT checkers.

It should be noted that self-verification is in no way intended to
\emph{replace} design time verification. If proof obligations can be
shown at design time, they should by all means be discharged; however,
self-verification offers a different way to tackle proof obligations which
can \emph{not} be shown at design time, supplementing design time
verification, and offering the designer to pick the best of all possible
worlds.


This raises the question of the general applicability of the approach. As
presented here, some kinds of safety-critical systems could not be
addressed adequately, namely fail-safe systems, where there is no default
safe state which we can always revert to if self-verification does not
succeed. On the other hand, an attractive avenue for further exploration is
"just-in-time verification", where one tries to prove properties at run
time as they are needed.