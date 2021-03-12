# Proof Partitioning

*Based on the original work "Verification Runtime Analysis: Get the Most Out of 
Partial Verification" [@VerificationRuntime]*

## Fixing Free Variables

In the following, we consider a verification problem as a single
proposition^[
  Note that a number of verification conditions can of course 
  always be combined into a single proposition by conjoining them. Furthermore, 
  we consider all variables to be Boolean. This does not restrict the 
  methodology (because other types such as integer variables can be encoded as 
  bit vectors) but significantly simplifies the exposition in the following.
] $\phi$ that shall be proven with contemporary reasoning
engines such as SAT solvers [@ES:2003; @Biere2008PicoSATE], SMT
solvers [@Moura2008Z3AE; @Brummayer2009BoolectorAE; @Wille2007SWORDAS],
or similar. The particular logic and reasoning engine used do not
matter, as long as the proof procedure is fully automatic. We are
interested in problems that cannot be solved using the given resources,
where verification process would be aborted and the verification engineers
would get no result at all.

In contrast, when enough variables are set to fixed values (we say the
variables are *fixed*), the search space is reduced and the reasoning
engine eventually yields a verification result. Even if such a result would
not cover all instances of the verification problem, 
proving an instance of $\phi$ may still be of potential value. 

This yields the questions *how many* and *which* variables should
be fixed. So far no detailed analysis exists on whether the number and
selection of variables matters, on by how much the verification time is
actually reduced, and how to measure these effects in the first place.
In an idealized scenario, answers to these questions would be as sketched in
the following example:

::: Example * {#ex:ideal_scen}
Consider a verification problem $\phi$ whose complete verification takes
a certain time $T_{\phi}$.  Setting *all* variables of $\phi$
to a fixed value will allow for a more or less instantaneous completion
of the verification task.^[
  In some logics (e.g. with nested quantifiers), this might not be the case,
  but the general principle that proving ground term propositions is much
  faster is still valid.
]
Moreover, in an idealized scenario, the proof time would be reduced
exponentially with respect to the number of fixed variables. This is
sketched by the *green solid line* in [#fig:runtime-idealized], showing an idealized graph
plotting the (presumed) average proof time (in logarithmic scale) over
the number of fixed variables. In this idealized scenario,
answers to the two questions raised above are trivial: It does not matter
*which* variables are fixed (any differences are
averaged out) and the *number* is basically determined by the
available resources; i.e. the available time (on the y-axis) determines
the corresponding number of variables (on the x-axis).
:::

![Idealized runtime of a verification problem.](){#fig:runtime-idealized}