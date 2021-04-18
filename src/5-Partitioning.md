# Proof Partitioning {#chap:partitioning}

The central means to reduce the search space during run-time and, by this, 
reduce the run time of the reasoning engine is to set a certain amount of the 
given variables to a fixed value. While the general methodology has been 
explored in the previous chapters, the question which variables to fix in 
order to achieve the largest reduction of verification run time has not been 
addressed yet. While in theory fixing one Boolean variable would reduce the 
search space and run time by half, actual instances show a much smaller and less 
uniform reduction due to the optimizations by the proof engine.  Some variables 
may hardly have an effect at all, while others may immediately cut down a 
day-long verification process to a few moments. Because of that, it is essential 
for verification engineers to have a clear understanding about the impact of 
fixing a particular variable on the verification run time, so they can follow the 
general idea of fixing some variables in order to get a partial result out of 
the verification process covering as many cases as possible. However, no 
systematic investigation on this effect has been conducted so far.

In this chapter, we introduce a methodology to analyze verification run time,
and to measure it practically in a meaningful way. The main problem is
*how many* and *which* variables are fixed. For this, we first state a formal 
criterion describing an optimal solution to this problem. Based on that, a cost 
function is defined which can be used to employ stochastic and heuristic methods 
in order to eventually determine solutions optimized for this goal.

Using a proof-of-concept implementation based on evolutionary algorithms,
we were able to confirm the potential of the proposed methodology. In fact, 
experimental evaluations confirmed that this methodology indeed determines a set 
of variables to be fixed which keeps the verification run time within specified 
limits while still covering as much as possible of the search space.

In general, the methodology works for any other heuristic which optimizes with 
respect to a given cost function, and the proposed analysis method is 
independent from both the reasoning engine and the underlying logical language, 
i.e. we treat the reasoning engine as a completely opaque black box which either 
proves a proposition or not.

This offers valuable information for designers following the approach of the 
previous chapters, to choose which parts of a proof offer the highest potential 
to be postponed for self-verification.

## Fixing Free Variables

In the following, we consider a verification problem as a single
proposition^[
  Note that a number of verification conditions can of course 
  always be combined into a single proposition by conjoining them. Furthermore, 
  we consider all variables to be Boolean. This does not restrict the 
  methodology (because other types such as integer variables can be encoded as 
  bit vectors) but significantly simplifies the exposition in the following.
] $\phi$ that shall be proven with contemporary reasoning
engines such as SAT solvers [@ES:2003;@Biere2008PicoSATE], SMT
solvers [@Moura2008Z3AE;@Brummayer2009BoolectorAE;@Wille2007SWORDAS],
or similar. The particular logic and reasoning engine used do not
matter, as long as the proof procedure is fully automatic. We are
interested in problems that cannot be solved using the given resources,
where the verification process would be aborted and the verification engineers
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
sketched by the *green solid line* in [#fig:runtime-idealized], showing an 
idealized graph plotting the (presumed) average proof time (in logarithmic 
scale) over the number of fixed variables. In this idealized scenario,
answers to the two questions raised above are trivial: It does not matter
*which* variables are fixed (any differences are
averaged out) and the *number* is basically determined by the
available resources; i.e. the available time (on the y-axis) determines
the corresponding number of variables (on the x-axis).
:::

However, such an idealized scenario almost never occurs. In fact, it
quickly becomes clear that the relation between the number of fixed
variables and the proof time is rather erratic.  Again, this is
illustrated by means of an example:

::: Example * {#ex:erratic}
Consider a representative benchmark taken from the SMT-LIB benchmark
library [@SMTLIB]^[The SMT-LIB library is composed of various benchmarks to
  challenge reasoning engines --- including many problems from the
  verification of circuits and systems --- and, hence, provides a
  representative source of problems to be considered within the scope
  of this work.] for which the relation between proof time and sets of
fixed variables have been evaluated. The obtained results are shown in
[#fig:runtime-idealized]. Here, each data point at $(n, t)$
corresponds to the average proof time $t$ of $\phi$ with $n$ different
variables fixed. As can clearly be seen, there is no
obvious relation between proof time and the number of fixed
variables. Instead, there are a number of data points which are better
than the idealized scenario discussed before in [#ex:ideal_scen], i.e. points 
which lie below the diagonal in [#fig:runtime-idealized].
:::

![Idealized and observed run time of a representative verification problem.](idealized-runtime.ts){#fig:runtime-idealized}

As illustrated by these observations, simply fixing a certain number of
variables of $\phi$ often does not yield the desired result.  Moreover, a
straightforward enumeration  is not
suitable because of the following issues:

Complexity

: Even if the number of variables to be fixed is
  given as say $m$, there still would be $2^m$ possible combinations left
  to try out.

Quality

: Proving $\phi$ with all variable fixed except for one
  certainly will be very fast, but will hardly give more insight than
  an aborted verification process. Hence, verification engineers are
  interested in restricting only as little variables as needed before the
  exponential blow-up kicks in.

Effectiveness

: We are particularly interested in verification
  problems which cannot be completed due to a time-out; here, we are
  looking for the data points which lie as much to the left in
  [#fig:runtime-idealized] as possible, but are still below the
  time-out. These are hard to find by enumeration as one would run into
  time-outs a lot.

In summary, we are interested in finding the data points in the lower left
corner of [#fig:runtime-idealized], which represent instances where
only a small number of variables are fixed (i.e. the instance is as
little restricted as possible), while at the same time run time is kept
small.

## Verification Run Time Analysis

The observations and discussions from above motivate an analysis of the
verification run time in order to determine the best possible data points.
This poses an optimization problem which has not been clearly defined
so far. In the following, a corresponding definition is provided which is 
used as a basis for the remainder of this work.

The inputs of the optimization problem are as follows:

- A reasoning engine (such as a SAT solver, SMT solver, or similar) which, 
  given a proposition, either returns  true, false or does not terminate.
- A proposition $\phi$ which takes the time $T_{\phi}$ to prove using the 
  reasoning engine. 

Note that the actual time units are irrelevant, but we assume that the time
is deterministic and reproducible.^[
  In the experiments summarized below, we use the number of elementary
  operations of the SMT solver *Z3* [@Moura2008Z3AE] as time unit
  (`rlimit` count), since this is deterministic and independent of 
  architecture or memory.]
Furthermore, the proof procedure may not terminate; in that case,
$T_{\phi}$ is a time unit which is larger than any finite one.

Let $\FV{\phi}$ denote the set of free variables occurring in $\phi$.  Given
a subset $X \subseteq \FV{\phi}$ of the free variables of $\phi$, we define
the *average verification run time* $\AvgTphi{X}$ as the average time
it takes to prove $\phi$ with the variables in $X$ set to ground terms, and
the rest in $\FV{\phi}\setminus X$ kept free. That is, $\AvgTphi{X}$ is the
*expected* verification run time if the variables in $X$ are set to an
arbitrary fixed value. 
We have found that, for a given $X$, we can approximate $\AvgTphi X$ with a
small number (five) of representative samples.

::: Example *
[#fig:runtime-idealized], which has already been discussed before,
also provides an illustration of this notation. The figure plots the average
verification run time $\AvgTphi X$ at the y-axis over the number of fixed
variables (i.e. the cardinality $|X|$ of $X$) at the x-axis for the 
representative benchmark discussed in [#ex:erratic]. Each
data point in the diagram corresponds to $(|X|,\AvgTphi X)$ for a
particular set $X$ of variables to be fixed.
:::

The aim of the analysis is to determine a set $X$ which is as small as
possible while still corresponding to a reasonable average verification time.
To this end, we need to investigate how the function mapping $X$ to
$\AvgTphi X$ behaves. With $\emptyset \subseteq X \subseteq \FV{\phi}$, we
can state that 

- $\AvgTphi{\FV{\phi}}$ is the minimum, because it proves a ground term
  (no free variables), and
- $\AvgTphi{\emptyset}= T_{\phi}$ is the maximum, because we prove the
  original proposition $\phi$.

However, in between, the behaviour is not so well defined. From the above,
we might guess that the smaller the set $X$, the larger the average
verification run time (i.e. $\AvgTphi X$ is anti-monotone over the size
of the variable set), but this turns out not be true (also confirmed by [#fig:runtime-idealized] discussed in [#ex:erratic]).
Mathematically, Given two different subsets $X,Y\in\FV{\phi}$, we have

$$
\begin{equation}
  \label{eq:avgt-not-monotone}
  |X| \leq |Y| \not\Longrightarrow \AvgT {\phi} X \geq \AvgT {\phi} Y.
\end{equation}
$$

In other words, increasing the number of fixed variables does not
necessarily decrease the average verification run time. This is because
variables may depend on other variables, i.e. if we set one of them to
a fixed value, the other one is restrained as well.

Hence, the problem remains how to determine an *optimal subset $X$*
of variables (optimal in the sense of largest set $X$ such that the average
verification time $\AvgTphi{X}$ is still acceptable).

## Proposed Solution {#sec:sol}

The problem motivated and introduced above can be addressed in a number of
different ways.  A straightforward approach might employ an iterative
scheme as follows: Determine the variable with the smallest verification
run time (i.e. determine the variable $x$ such that $\AvgTphi{\{x\}}$ is minimal).
Then, leave it free and determine the variable with the smallest verification
run time among the remaining variables. Repeat this process until you reach
an average run time which is not feasible anymore.
However, because of [#eq:avgt-not-monotone], such straight-forward
approaches do not lead to satisfactory results in most cases. The optimal 
solution for say two variables is
not necessarily a subset of the optimal solution for three
variables (they are not even guaranteed to intersect at all).
So we lack an order structure on the space of possible solutions ---
all subsets of $\FV{\phi}$ --- which can guide a search process to the
optimal solution. To determine a solution in a rather unstructured
space of solutions (such as this one), a number of probabilistic and
heuristic approaches are available (e.g. simulated annealing,
evolutionary algorithms, etc.). However, all of these need a dedicated
*cost function* which unambiguously describes the quality in a quantifiable 
fashion (i.e. as a number) to guide the search.

![Contour of the cost function](cost-contour.ts){#fig:runtime-score}

To get this cost function, we propose a geometric interpretation of
the data points in [#fig:runtime-idealized]. We are
looking for the one which is closest to the bottom left corner, i.e.
which has the least distance to the origin. Geometrically, if we
consider our data points as vectors, we are looking for the vector
with the smallest length. In order to make the cost function behave
uniformly for different propositions $\phi$, we scale both axes with
the maximum, i.e. the size of the set of fixed variable $|X|$ with the
total number of free variables $|\FV{\phi}|$ and the average
verification run time $\AvgTphi X$ with the proof time of the original
proposition $T_{\phi}$. Thus, for a set $X$ of variables to be fixed, our
cost function is

$$
\begin{equation}
  \label{eq:quality-measure}
  q(X) \triangleq \sqrt{\left(\frac{|X|}{\left|\FV{\phi}\right|}\right)^2+\left(\frac{\log(\AvgTphi{X})}{\log(T_{\phi})}\right)^2}.
\end{equation}
$$

::: Example * 
  [#fig:runtime-score] visualizes the contours of the cost function
  ($q$ from [#eq:quality-measure]). The theoretical optimum lies at
  $q(0,0) = 0$. When applied to the results of
  [#fig:runtime-idealized], a ranking of the data points becomes
  apparent, ordering the data points by the distance to the origin (highlighted 
  by solid lines in [#fig:runtime-score]). Considering this as cost metric, the
  optimal solution is the point marked with a green circle in [#fig:runtime-score].
:::

Our cost function requires a concrete value for $T_{\phi}$ which can
only be approximated (see [#sec:rta-implementation]),
as we are considering propositions where $T_{\phi}$ is very large (in
practice, a time-out). Hence, we need an upper limit for the solutions
to consider during the analysis, otherwise we would constantly run
into time-outs. Given an upper limit $T_{max}$ which is considered
acceptable for the analysis, the *threshold* $\tau(\phi)$ is
defined as the number of variables to be fixed such that the average
verification run time is still below $T_{max}$. The value of
$\tau(\phi)$ can be efficiently approximated e.g. through a binary
search. This confines the number of data points to be considered to
the ones which can be analyzed within acceptable run time.

::: Example *
For the example considered above, assume an acceptable time limit
$T_{max}$. Based on this, approximate $\tau(\phi)$ as illustrated by
the dotted lines in [#fig:runtime-score]. Now, only the
data points between the left bottom corner and these lines
lines are considered during analysis. This way, it is ensured that a
good solution is derived while, at the same time, the analysis time
remains efficient.
:::

Using this cost function and the threshold, any heuristic method of choice can
be applied to determine a set $X$ such that $q(X)$ is minimized -- this
will be our desired solution.

## Implementation {#sec:rta-implementation}

In this section, we describe one possible implementation of the proposed
solution described above. As a heuristic, we decided to use *Evolutionary Algorithms* 
(EAs, [@DBLP:journals/complexity/Fogel97;@DBLP:journals/ec/MichalewiczS96]) 
which represent an established method to solve optimization problems, with
applications in hardware design [@KorousicSeljak2005AnEA;@Vascek2015EvolutionaryAT] 
or multi-objective optimization [@Chen2018DynamicMO;@Deb2015MultiObjectiveEA].
In the following, we briefly review the basic concepts of EAs in general,
before discussing how those concepts are utilized in order to address the
problem.^[However, note that any other optimization
  methodology can be applied as well, and that the usage of EAs
  only constitutes a representative.]

### Evolutionary Algorithms

Evolutionary algorithms are stochastic search methods inspired by the natural 
evolution process. The goal is to find a group of individuals (representing 
solutions) which have the best fitness according to a requested property (in 
our case, which best satisfy the cost function stated in [#eq:quality-measure]).

In order to use EAs for an optimization problem, the following aspects need to 
be formulated with respect to the considered problem:

Individuals

: An individual represents a possible solution
  for a considered problem, and a set of individuals constitute a
  population representing a set of solutions. The idea of EAs is that
  these populations (and hence solutions) are improved over generations.

Mutation operation

: Each individual of a population is subjected to mutations which change the 
  solution each individual represents, and hence explore new parts of
  the search space.          

Recombination operation

: Recombinations combine the characteristics of more than one individual, 
  hoping to get the best out of them towards a better solution.
  Recombinations aim for employing changes to individuals in order to
  explore new parts of the search space as well, but also converge on
  existing individuals.

Fitness function

: After each mutation and recombination,
  new individuals (the offspring population)
  are generated. To decide which individuals shall be considered
  further, a fitness function selects the best individuals
  and promising candidates for the next generation.

Overall, the typical flow of EAs starts with the generation of an initial
population.
Afterwards, a sequence of mutation and recombination operations is
conducted which yield new generations of populations. The
fitness function selects the 
individuals for the next generation. This process is
continued until the process converges (i.e. no real improvements are
observed any more) or until a time limit terminates the process.

### EA-based Verification Run Time Analysis {#sec:ea_sol}

In the following, we describe how EAs can be utilized for the optimization
problem defined above.  Recall that we are interested in keeping the set
$X$ of variables to be fixed as small as possible while the average
verification run time $\AvgTphi X$ remains feasible for the reasoning
engine. With this as a basis, we can formulate the
different EA aspects with respect to the considered problem as follows:

#### Individuals

An individual represents a potential solution $X$ as a bit vector 
$I=\Tuple{I_i}_{i=1,\ldots,|\FV{\phi}|}$ of size 
$|\FV{\phi}|$ such that for every variable $x_i \in \FV{\phi}$ there is a 
corresponding bit $I_i$ in $I$ which indicates whether $x_i \in X$. 

#### Mutation
Based on the description of an individual, mutations are performed as follows:
Given an individual $I$ and a mutation rate $p_m$, every bit of its vector is 
flipped with probability $p_M$.
This leads to a new individual $J$, representing the new solution.

$$
\begin{align*}
% \label{eq:mutation_operation}
  m(I,p_m) & = \Tuple{J_i}_{i=1,\ldots,|\FV{\phi}|} \\
  J_i & = \begin{cases}
  \text{flip}~I_i & ~\text{with}~p_m\\
  I_i & \text{otherwise}
\end{cases}
\end{align*}
$$

#### Recombination

Recombinations are performed as follows: Given two individuals $I, J$ and a
recombination bias $p_c$, we combine the two bit vectors by retaining bits which 
have equal values in both vectors, but randomly choose bits from $I$ or $J$ at 
positions where they differ. The recombination bias is applied here to prefer one
of the individuals. The recombination leads to a new offspring $K$.

$$
\begin{align*}
% \label{eq:recombination_operation}
r(I,J,p_r) & =  \Tuple{K_i}_{i=1,\ldots,|\FV{\phi}|} \\
K_i & = \begin{cases}
I_i, & \text{if}~I_i = J_i\\
I_i, & \text{with}~p_c\\
J_i, & \text{otherwise}
\end{cases}
\end{align*}
$$

#### Fitness Function

We employ $q$ from [#eq:quality-measure] as the fitness function, with 
$T_{\phi}$ approximated as $T_{max} \cdot 2^{\tau(\phi)}$.  $\AvgTphi{X}$ is 
approximated by averaging the results of a small number of concrete
measured times. 

#### Implementation Aspects

The implementation is available on GitHub:

[![martinring/clash-compiler - GitHub](https://gh-card.dev/repos/DFKI-CPS/verification-runtime-analysis.svg?fullname=)](https://github.com/martinring/clash-compiler/tree/yices){.ghlink}

The *initial population* is obtained by first approximating the
threshold $\tau(\phi)$ with a binary search and then instantiating
random individuals with $\tau(\phi)$ positive bits. We employ the
algorithm with a very low *mutation rate* $p_m$, since this
yields better recombination results. Individuals to *recombine*
are randomly chosen using a normal distribution which prefers the best
individuals.  In addition, we apply a recombination bias $p_r$ towards
the individual with the better score.  We monitor the progress of the
optimization and spawn increasingly many independent individuals as
the optimization slows down. In the beginning, these random
individuals are of cardinality $|X|$ where $X$ is the best solution
found so far. With every generation which does not yield an
improvement over the last, we increase the deviation from $|X|$ in
order to avoid getting stuck in a local optimum.

Even though the strategies described here constitute only one possible
implementation, it yields very promising results, as the experimental
evaluations summarized in the next section will show.

## Experiments and Results {#sec:rta-exp}

The solution proposed above has been implemented and evaluated using a
large corpus of verification instances.  This section summarizes the
most important results obtained by this evaluation. To this end, we
first briefly provide details on the actual set-up as well as
the considered benchmarks. Afterwards, the obtained results are
presented and discussed.

### Set-up

As input for the considered problem, we used verification benchmarks
provided by the SMT-LIB benchmark library [@SMTLIB] (in the bit vector logic 
QF_BV), and the SMT solver Z3 [@Moura2008Z3AE] as the reasoning engine. The EA 
has been implemented in the programming language Scala. This language runs on 
the Java Virtual Machine (JVM), so we use the Java bindings of Z3.

In order to have a deterministic and reproducible notation of time for
the analysis, we used Z3's `rlimit` count as a time unit, which
provides the number of elementary operations required to solve an
instance. This way, the time measurements (required for the
fitness function of the EA) remain independent from the actual
platform and hardware. The target time-out $T_{max}$ was set to an
`rlimit` count of $500\,000$ which is roughly equivalent to
$0.5s$ of computation on the utilized compute server^[Note that there is no 
exact relation between Z3's `rlimit` count and real time since `rlimit` also 
considers memory operations.]

Using this set-up, the verification run time analysis determines the
desired set $X$ out of which the variables to be set to fixed values
can be obtained.  Afterwards, the originally given proposition $\phi$
as well as the proposition with the variables in $X$ set to ground
terms is solved by Z3 again --- showing the impact of the obtained
analysis results. For the evaluations, solving times have been
measured on an Intel Xeon (E3-1270 v3) compute server with 8 cores and
16 GB of memory running Linux.

### Considered Benchmarks

Our methodology is meant for hard verification tasks which do not terminate 
before a given time-out. The SMT-LIB library provides a huge, representative 
corpus of such problems from the verification of circuits and systems, 
constituting a representative source of problems for our evaluations.
We considered non-iterative quantifier-free bit vector logic (QF_BV)
benchmarks from the category "industrial" which are marked as
"unsat", where $\tau(\phi)$ (determined by binary search as
described above) is larger than 10; the latter ensures that trivial
benchmarks which complete in less than roughly
$T_{max} \cdot 2^{10} \approx 512s$ are omitted.

With the remaining set of hard benchmarks, the proposed method has
been evaluated on a total of 333 propositions.  The mean run time
$t_\text{A}$ of the analysis was 86 seconds. 34\% (114) of the
benchmarks were analyzed in under 60 seconds, 93\% (309) finished in
less than 10 minutes, and the longest took 23 minutes 37 seconds. There was no
significant relation between the run time of the analysis and the
original proof time.

### Obtained Results

A representative subset of results is summarized in [#tab:rta-results] 
(For the full results see the linked github repository). Here, the first 
columns denote the problem size: the number of SMT variables, and the number of 
bits ($|\FV{\phi}|$) representing those SMT variables. The next group of
columns shows the results of the analysis: $\tau(\phi)$ is the
initially approximated number of variables that has to be fixed, $|X|$
is the size (in bits) of the found solution $X$; and $t_\text{A}$ is the
run time of the analysis itself. The last column group shows the
reduction in verification run time: $T(\phi)$ is the run time with
state-of-the-art verification (which results in a time-out for all
problems because we explicitly consider hard ones).
$\hat{T}^\text{rnd}_\phi(|X|)$ denotes the run time when just an
arbitrary selection of variables $Y \subset \FV{\phi}$ with the same
size $|Y| = |X|$ is set to a fixed value, while $\AvgTphi{X}$ denotes
the run time when exactly the variables in $X$ are set to a fixed
value.

The results clearly confirm the benefits of our approach.  While it is
in general not surprising that fixing a number of variables reduces
the verification run time, our analysis yields a small number $|X|$ of
variables to fix for maximum effect. By this, verification
engineers get much more out of partial verification since it allows
them to only set a small portion of the
variables to a fixed value. E.g. for *calypto/problem_22.smt2*, 
a naive method would have led
them to set $\tau(\phi)=128$ variables to a fixed value; with the
sophisticated analysis method proposed in this work, just fixing
$|X|=13$ is sufficient --- yielding substantially larger coverage.

Moreover, the results confirm that not only the number $|X|$ of
variables is important (*how many?*), but also which variables
should be set to a fixed value (*which?*).  This can clearly be
seen in the last two columns of [#tab:rta-results] randomly
fixing $|X|$ variables often leads to a time-out ($600s$). In
contrast, fixing exactly those variables $X$ obtained by the proposed
analysis allows solving *all* benchmarks in negligible run time.


The identified candidates do indeed reduce run time significantly with respect to 
randomly constrained instances. Out of 333 instances there were 221 which were 
sped up by factor 10 or more, 167 were sped up by factor 100 or more and 94 were 
sped up by factor 1000 and more. For 11 benchmarks the reference time could not
be determined due to time-outs of factor >10000.

Those benchmarks which were not significantly sped up can actually be recognized during 
analysis because they show no clear relation between sets of variables and 
run time and thus have large fluctuations within the population over generations 
of the EA. We identified sevaral reasons, why this can happen: when too much information 
is represented by a single SMT variable; when there are only pseudo-random 
dependencies between variables and when too much of the heavy lifting happens in
local function definitions. However, these instances can be quickly identified 
and might be fixable by adapting the representation of the proof.


<style>
#tab\:rta-results {
  border: none;
  line-height: 1.2;
  font-size: 0.8rem;
  white-space: nowrap;
}
#tab\:rta-results td, #tab\:rta-results th {
  padding: 0.1rem 0.3rem;
}
#tab\:rta-results > thead > tr:first-child > th {
  text-align: center !important;
}
#tab\:rta-results > tbody:last-child {
  border-top: 2px solid black;
}
#tab\:rta-results > thead > tr > th:nth-child(1),
#tab\:rta-results > thead > tr:first-child > th:not(:first-child),
#tab\:rta-results > thead > tr:last-child > th:nth-child(3),
#tab\:rta-results > thead > tr:last-child > th:nth-child(6),
#tab\:rta-results > thead > tr:last-child > th:last-child,
#tab\:rta-results > tbody:not(:last-child) > tr > td:nth-child(1),
#tab\:rta-results > tbody:not(:last-child) > tr > td:nth-child(3),
#tab\:rta-results > tbody:not(:last-child) > tr > td:nth-child(6),
#tab\:rta-results > tbody:not(:last-child) > tr > td:last-child {
  border-right: 1px solid black;
}
#tab\:rta-results > thead > tr:first-child > th:not(:first-child) {
  border-top: 2px solid black;
}
#tab\:rta-results td:not(:first-child) {
  font-variant-numeric: tabular-nums lining-nums;
}
#tab\:rta-results span.star {
  position: absolute  
}
</style>

|                                                |    Problem Size                                                  ||     Analysis                        |||                       Verification Run time Reduction                                  |||
 Benchmark                                       |   SMT Variables | $\lvert\FV{\phi}\rvert$                         | $\tau(\phi)$ | $\lvert X\rvert$ | $t_\text{A}$ |                    $T(\phi)$   | $\hat{T}^\text{rnd}_\phi(\lvert X\rvert)$ | $\hat{T}_{\phi}(X)$ |
:------------------------------------------------|----------------:|------------------------------------------------:|-------------:|-----------------:|-------------:|-------------------------------:|------------------------------------------:|--------------------:|
 calypto/problem_22.smt2                         |             33  |                                            205  |         128  |              13  |        173s  |            > 3600 s[*]{.star}  |                     > 600.00 s[*]{.star}  |             0.02 s  |
 float/newton.1.3.i.smt2                         |            427  |                                           8498  |         135  |              33  |         92s  |            > 3600 s[*]{.star}  |                     > 600.00 s[*]{.star}  |             0.12 s  |
 float/test_v5_r10_vr10_c1_s7608.smt2            |            855  |                                          17860  |          91  |              35  |        298s  |            > 3600 s[*]{.star}  |                                  64.15 s  |             0.16 s  |
 float/test_v5_r15_vr5_c1_s23844.smt2            |           1280  |                                          26710  |         235  |              48  |        492s  |            > 3600 s[*]{.star}  |                                 301.85 s  |             0.23 s  |
 float/test_v7_r12_vr1_c1_s10576.smt2            |           1431  |                                          29853  |         234  |              50  |        525s  |            > 3600 s[*]{.star}  |                                 113.98 s  |             0.26 s  |
 float/test_v7_r17_vr5_c1_s25451.smt2            |           2024  |                                          42194  |         157  |              65  |        326s  |            > 3600 s[*]{.star}  |                                  94.39 s  |             0.36 s  |
 mcm/23.smt2                                     |             33  |                                            363  |          10  |              11  |         45s  |            > 3600 s[*]{.star}  |                                  62.04 s  |             0.03 s  |
 mcm/63.smt2                                     |             36  |                                            432  |          29  |              12  |         49s  |            > 3600 s[*]{.star}  |                                 155.09 s  |             0.04 s  |
 mcm/69.smt2                                     |             33  |                                            396  |          12  |              12  |         47s  |            > 3600 s[*]{.star}  |                                 108.72 s  |             0.04 s  |
 tacas07/Y86_std.smt2                            |            246  |                                           5795  |         700  |             109  |        437s  |            > 3600 s[*]{.star}  |                     > 600.00 s[*]{.star}  |             0.07 s  |
 uum/uum16.smt2                                  |            190  |                                           3428  |          29  |              16  |         27s  |            > 3600 s[*]{.star}  |                     > 600.00 s[*]{.star}  |             0.01 s  |
 uum/uum20.smt2                                  |            234  |                                           5244  |          36  |              20  |         29s  |            > 3600 s[*]{.star}  |                     > 600.00 s[*]{.star}  |             0.02 s  |

                                                 |                 |                                                 |              |                  |              | * = time-out                                                                                |||

: Obtained Results {.standalone .rotated #tab:rta-results}

### Further Discussion

The obtained results show how many and which variables to fix to get as much
as possible out of partial verification. In this regard, note that there may be 
external reasons to fix (or not fix) a variable. For example, it makes no sense 
to fix sensor input which changes rapidly, but it makes a lot of sense to fix 
configuration parameters which rarely change. Obviously such considerations can 
easily be integrated into the proposed analysis e.g. by adding a *weight* to the
variables such that instantiating some variables (which do not change often) is 
favourable to instantiating others (which do change often).

With regard to related work, the term "partial verification" is also used with 
model checking, in particular software model checking (see 
e.g. [@Parizek2007,@Groce2004]), referring to techniques to reduce the search 
space in order to find counterexamples (and, hence, bugs), or referring to the 
exchange of results between different automatic tools (model checkers, static 
analyzers, theorem provers) such that the combination of partial results makes 
the whole verification succeed (see e.g. [@Wuestholz,@Beyer2016]). This is also 
referred to as conditional model checking [@Beyer2012]. Furthermore, the term is 
also used in the context of agents [@Caragiannis2012,@Yu2011], but refers to 
verification of truthfulness. However, the methodology proposed in this chapter 
here is not related to any of these previous work and, hence, is novel to the 
best of our knowledge.

## Conclusion

In this chapter, we presented a systematic verification run time analysis which 
shows *how many* and *which* variables to fix for maximum verification run time 
reduction. Experimental evaluations based on a proof-of-concept implementation 
confirmed the potential and demonstrated that the proposed analysis method
does not only yield a partial verification result, but also gets the most out of 
it. Considering that further analysis methods can be implemented on top of this 
methodology, this work provides a promising basis for future work in this 
direction.

In the context of self-verification this analysis method is able to indicate to 
the designer, which parts of a proof are worthy to transfer or postpone into 
run-time and by this enhances the workflow.