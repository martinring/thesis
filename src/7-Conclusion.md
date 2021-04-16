# Conclusion {#chap:conclusion}

This thesis has elaborated on self-verification — systems which are not 
verified a priori, during the design phase, but where the proof obligations 
incurred during the development are postponed until after deployment, and are 
proven at runtime. This makes proofs more easy, as we can instantiate a number 
of the parameters of the system which are unknown at design time, but become 
known at runtime. This reduces the state space, turning the exponential growth 
of the state space — the bane of model-checking — into exponential reduction. 
Self-verification is supported by a tool chain we have developed, which allows 
specification in SysML/OCL, system modelling in Clash, and verification using 
SMT provers and SAT checkers. It should be noted that self-verification is in 
no way intended to replace design time verification. If proof obligations can be 
shown at design time, they should by all means be discharged; however, 
self-verification offers a different way to tackle proof obligations which 
cannot be shown at design time, supplementing design time verification, and 
offering the designer to pick the best of all possible worlds.

