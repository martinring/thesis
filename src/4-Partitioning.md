# Proof Partitioning

*Based on the original work "Verification Runtime Analysis: Get the Most Out of 
Partial Verification" [@VerificationRuntime]*

In order to 

## Reducing Verification Runtime {#sec:introducing}

In this section, we describe the main idea of the proposed verification
runtime analysis. Recall that our goal is to determine how many and
which variables to fix in order to achieve as much of a reduction in
verification runtime as possible (and, by this, getting as much out of a
partial verification as possible, rather than no result at all).

## Fixing Free Variables

In the following, we consider a verification problem as a single
proposition[^1] $\phi$ that shall be proven with contemporary reasoning
engines such as SAT solvers [@ES:2003; @Biere2008PicoSATE], SMT
solvers [@Moura2008Z3AE; @Brummayer2009BoolectorAE; @Wille2007SWORDAS],
or similar. The particular logic and reasoning engine used do not
matter, as long as the proof procedure is fully automatic. We are
interested in problems that cannot be solved using the given resources,
where verification process would be aborted and the verification
engineers would get no result at all.

In contrast, when enough variables are set to fixed values (we say the
variables are *fixed*), the search space is reduced and the reasoning
engine eventually yields a verification result. Even if such a result
would not cover all instances of the verification problem, proving an
instance of $\phi$ may still be of potential value.

This yields the questions *how many* and *which* variables should be
fixed. In an idealized scenario, answers to these questions would be as
sketched in the following example:

::: Example * 
Consider a verification problem $\phi$ whose complete verification takes a certain
time $T_{\phi}$. Setting *all* variables of $\phi$ to a fixed value will
allow for a more or less instantaneous completion of the verification
task.[^2] Moreover, in an idealized scenario, the proof time would be
reduced exponentially with respect to the number of fixed variables.
This is sketched by the *green solid line* in , showing an idealized
graph plotting the (presumed) average proof time (in logarithmic scale)
over the number of fixed variables. In this idealized scenario, answers
to the two questions raised above are trivial: It does not matter
*which* variables are fixed (any differences are averaged out) and the
*number* is basically determined by the available resources; the
available time (on the y-axis) determines the corresponding number of
variables (on the x-axis).
:::

However, such an idealized scenario almost never occurs. In fact, it
quickly becomes clear that the relation between the number of fixed
variables and the proof time is rather erratic. Again, this is
illustrated by means of an example: 

![]()

::: Example *
Consider a
representative benchmark taken from the SMT-LIB benchmark
library [@SMTLIB][^3] for which the relation between proof time and sets
of fixed variables have been evaluated. The obtained results are shown
in . Here, each data point at $(n, t)$ corresponds to the average proof
time $t$ of $\phi$ with $n$ different variables fixed. As can clearly be
seen, there is no obvious relation between proof time and the number of
fixed variables. Instead, there are a number of data points which are
better than the idealized scenario discussed before in
Example [\[ex:ideal_scen\]](#ex:ideal_scen){reference-type="ref"
reference="ex:ideal_scen"}, points which lie below the diagonal in .
:::

As illustrated by these observations, simply fixing a certain number of
variables of $\phi$ often does not yield the desired result. Moreover, a
straightforward enumeration is not suitable because of the following
issues:

-   *Complexity*: Even if the number of variables to be fixed is given
    as say $m$, there still would be $2^m$ possible combinations left to
    try out.

-   *Quality*: Proving $\phi$ with all variable fixed except for one
    certainly will be very fast, but will hardly give more insight than
    an aborted verification process. Hence, verification engineers are
    interested in restricting only as little variables as needed.

-   *Effectiveness*: We are particularly interested in verification
    problems which cannot be completed due to a time-out; here, we are
    looking for the data points which lie as much to the left in as
    possible, but are still below the time-out. These are hard to find
    by enumeration as one would run into time-outs a lot.

In summary, we are interested in finding the data points in the lower
left corner of , which represent instances where only a small number of
variables are fixed (the instance is as little restricted as possible),
while at the same time runtime is kept small.

## Verification Runtime Analysis

The observations and discussions from above motivate an analysis of the
verification runtime in order to determine the best possible data
points. This poses an optimization problem which has not been clearly
defined so far. In the following, a definition is provided which is used
as a basis for the remainder of this chapter.

The inputs of the optimization problem are as follows:

-   A reasoning engine (such as a SAT solver, SMT solver, or similar)
    which, given a proposition, either returns true, false or does not
    terminate.

-   A proposition $\phi$ which takes the time $T_{\phi}$ to prove using
    the reasoning engine.

Note that the actual time units are irrelevant, but we assume that the
time is deterministic and reproducible.[^4] Furthermore, the proof
procedure may not terminate; in that case, $T_{\phi}$ is a time unit
which is larger than any finite one.

Let $\operatorname{\textit{FV}}(\phi)$ denote the set of free variables
occurring in $\phi$. Given a subset
$X \subseteq \operatorname{\textit{FV}}(\phi)$ of the free variables of
$\phi$, we define the *average verification runtime* $\hat{T}_{\phi}(X)$
as the average time it takes to prove $\phi$ with the variables in $X$
set to ground terms, and the rest in
$\operatorname{\textit{FV}}(\phi)\setminus X$ kept free. That is,
$\hat{T}_{\phi}(X)$ is the *expected* verification runtime if the
variables in $X$ are set to an arbitrary fixed value. We have found
that, for a given $X$, we can approximate $\hat{T}_{\phi}(X)$ with a
small number (five) of representative samples.

::: {.example}
also provides an illustration of this notation. The figure plots the
average verification runtime $\hat{T}_{\phi}(X)$ at the y-axis over the
number of fixed variables (i.e. the cardinality $|X|$ of $X$) at the
x-axis for the representative benchmark discussed in
Example [\[ex:erratic\]](#ex:erratic){reference-type="ref"
reference="ex:erratic"}. Each data point in the diagram corresponds to
$(|X|,\hat{T}_{\phi}(X))$ for a particular set $X$ of variables to be
fixed.
:::

The aim of the analysis is to determine a set $X$ which is as small as
possible while still corresponding to a reasonable average verification
time. To this end, we need to investigate how the function mapping $X$
to $\hat{T}_{\phi}(X)$ behaves. With
$\emptyset \subseteq X \subseteq \operatorname{\textit{FV}}(\phi)$, we
can state that

-   $\hat{T}_{\phi}(\operatorname{\textit{FV}}(\phi))$ is the minimum,
    because it proves a ground term (no free variables), and

-   $\hat{T}_{\phi}(\emptyset)= T_{\phi}$ is the maximum, because we
    prove the original proposition $\phi$.

However, in between, the behaviour is not so well defined. From the
above, we might guess that the smaller the set $X$, the larger the
average verification runtime ( $\hat{T}_{\phi}(X)$ is anti-monotone over
the size of the variable set), but this turns out not be true. Given two
different subsets $X,Y\in\operatorname{\textit{FV}}(\phi)$, we have
$$\label{eq:avgt-not-monotone}
  |X| \leq |Y| \not\Longrightarrow \hat{T}_{\phi}(X) \geq \hat{T}_{\phi}(Y).$$

In other words, increasing the number of fixed variables does not
necessarily decrease the average verification runtime. Hence, the
problem remains how to determine an *optimal subset $X$* of variables
such that the average verification time $\hat{T}_{\phi}(X)$ is still
acceptable.

## Proposed Solution {#sec:sol}

The problem motivated and introduced above can be addressed in a number
of different ways. However, a straightforward enumerative approach does
not work here, as the optimal solution for say two variables is not
necessarily a subset of the optimal solution for three variables (they
are not even guaranteed to intersect at all). So we lack an order
structure on the space of possible solutions --- all subsets of
$\operatorname{\textit{FV}}(\phi)$ --- which can guide a search process
to the optimal solution. To determine a solution in a rather
unstructured space of solutions (such as this one), a number of
probabilistic and heuristic approaches are available (simulated
annealing, evolutionary algorithms, ). However, all of these need a
dedicated *cost function* to guide the search.

To get this cost function, we propose a geometric interpretation of the
data points in . We are looking for the one which is closest to the
bottom left corner, which has the least distance to the origin.
Geometrically, if we consider our data points as vectors, we are looking
for the vector with the smallest length. In order to make the cost
function behave uniformly for different propositions $\phi$, we scale
both axes with the maximum, the size of the set of fixed variable $|X|$
with the total number of free variables
$|\operatorname{\textit{FV}}(\phi)|$ and the average verification
runtime $\hat{T}_{\phi}(X)$ with the proof time of the original
proposition $T_{\phi}$. Thus, for a set $X$ of variables to be fixed,
our cost function is $$\label{eq:quality-measure}
  q(X) \triangleq \sqrt{\left(\frac{|X|}{\left|\operatorname{\textit{FV}}(\phi)\right|}\right)^2+\left(\frac{\log(\hat{T}_{\phi}(X))}{\log(T_{\phi})}\right)^2}.$$

::: {.example}
visualizes the contours of the cost function $q$ from
Eq. ([\[eq:quality-measure\]](#eq:quality-measure){reference-type="ref"
reference="eq:quality-measure"}). The theoretical optimum lies at
$q(0,0) = 0$. When applied to the results of , a ranking of the data
points becomes apparent, ordering the data points by the distance to the
origin (highlighted by solid lines in ). Considering this as cost
metric, the optimal solution is the point marked with a green circle in
.
:::

Our cost function requires a concrete value for $T_{\phi}$ which can
only be approximated, as we are considering propositions where
$T_{\phi}$ is very large (in practice, a time-out). Hence, we need an
upper limit for the solutions to consider during the analysis, otherwise
we would constantly run into time-outs. Given an upper limit $T_{max}$
which is considered acceptable for the analysis, the *threshold*
$\tau(\phi)$ is defined as the number of variables to be fixed such that
the average verification runtime is still below $T_{max}$. The value of
$\tau(\phi)$ can be efficiently approximated through a binary search.
This confines the number of data points to be considered to the ones
which can be analyzed within acceptable runtime.

::: {.example}
For the example considered above, assume an acceptable time limit
$T_{max}$. Based on this, approximate $\tau(\phi)$ as illustrated by the
dotted lines in . Now, only the data points between the left bottom
corner and these lines lines are considered during analysis. This way,
it is ensured that a good solution is derived while, at the same time,
the analysis time remains efficient.
:::

Using this cost function and the threshold, any heuristic method of
choice can be applied to determine a set $X$ such that $q(X)$ is
minimized -- this will be our desired solution.

## Implementation {#sec:implementation}

In this section, we describe one possible implementation of the proposed
solution described above. As a heuristic, we decided to use
*Evolutionary
Algorithms* (EAs, [@DBLP:journals/complexity/Fogel97; @DBLP:journals/ec/MichalewiczS96])
which represent an established method to solve optimization problems,
with applications in hardware
design [@KorousicSeljak2005AnEA; @Vascek2015EvolutionaryAT] or
multi-objective
optimization [@Chen2018DynamicMO; @Deb2015MultiObjectiveEA]. In the
following, we briefly review the basic concepts of EAs in general,
before discussing how those concepts are utilized in order to address
the problem.[^5]

### Evolutionary Algorithms

Evolutionary algorithms are stochastic search methods inspired by the
natural evolution process. The goal is to find a group of individuals
(representing solutions) which have the best fitness according to a
requested property (in our case, which best satisfy the cost function
stated in
Eq. ([\[eq:quality-measure\]](#eq:quality-measure){reference-type="ref"
reference="eq:quality-measure"})).

In order to use EAs for an optimization problem, the following aspects
need to be formulated:

-   *Individuals*: An individual represents a possible solution for a
    considered problem, and a set of individuals constitute a population
    representing a set of solutions. The idea of EAs is that these
    populations (and hence solutions) are improved over generations.

-   *Mutation operation*: Each individual of a population is subjected
    to mutations which change the solution each individual represents,
    and hence explore new parts of the search space.

-   *Recombination operation*: Recombinations combine the
    characteristics of more than one individual, hoping to get the best
    out of them towards a better solution. Recombinations explore new
    parts of the search space as well, but also converge on existing
    individuals.

-   *Fitness function*: After each mutation and recombination, new
    individuals are generated. To decide which individuals shall be
    considered further, a fitness function selects the best individuals
    and promising candidates for the next generation.

Overall, the typical flow of EAs starts with the generation of an
initial population. Afterwards, a sequence of mutation and recombination
operations is conducted which yield new generations of populations. The
fitness function selects the individuals for the next generation. This
process is continued until the process converges (no real improvements
are observed any more) or until a time limit terminates the process.

### EA-based Verification Runtime Analysis {#sec:ea_sol}

In the following, we describe how EAs can be utilized for the
optimization problem defined above. Recall that we are interested in
keeping the set $X$ of variables to be fixed as small as possible while
the average verification runtime $\hat{T}_{\phi}(X)$ remains feasible
for the reasoning engine. With this as a basis, we can formulate the
different EA aspects with respect to the considered problem as follows:

#### Individuals {#individuals .unnumbered}

An individual represents a potential solution $X$ as a bit vector
$I=\Tuple{I_i}_{i=1,\ldots,|\operatorname{\textit{FV}}(\phi)|}$ of size
$|\operatorname{\textit{FV}}(\phi)|$ such that for every variable
$x_i \in \operatorname{\textit{FV}}(\phi)$ there is a corresponding bit
$I_i$ in $I$ which indicates whether $x_i \in X$.

#### Mutation {#mutation .unnumbered}

Based on the description of an individual, mutations are performed as
follows: Given an individual $I$ and a mutation rate $p_m$, every bit of
its vector is flipped with probability $p_M$. This leads to a new
individual $J$, representing the new solution. 

$$
\begin{aligned}
% \label{eq:mutation_operation}
  m(I,p_m) & = \Tuple{J_i}_{i=1,\ldots,|\operatorname{\textit{FV}}(\phi)|} \\
  J_i & = \begin{cases}
  \text{flip}~I_i & ~\text{with}~p_m\\
  I_i & \text{otherwise}
\end{cases}\end{aligned}
$$

#### Recombination {#recombination .unnumbered}

Recombinations are performed as follows: Given two individuals $I, J$
and a recombination bias $p_c$, we combine the two bit vectors by
retaining bits which have equal values in both vectors, but randomly
choose bits from $I$ or $J$ at positions where they differ. The
recombination bias is applied here to prefer one of the individuals. The
recombination leads to a new offspring $K$. 

$$\begin{aligned}
% \label{eq:recombination_operation}
r(I,J,p_r) & =  \Tuple{K_i}_{i=1,\ldots,|\operatorname{\textit{FV}}(\phi)|} \\
K_i & = \begin{cases}
I_i, & \text{if}~I_i = J_i\\
I_i, & \text{with}~p_c\\
J_i, & \text{otherwise}
\end{cases}\end{aligned}
$$

#### Fitness Function {#fitness-function .unnumbered}

We employ $q$ from
Eq. ([\[eq:quality-measure\]](#eq:quality-measure){reference-type="ref"
reference="eq:quality-measure"}) as the fitness function, with
$T_{\phi}$ approximated as $T_{max} \cdot 2^{\tau(\phi)}$.
$\hat{T}_{\phi}(X)$ is approximated by averaging the results of a small
number of concrete measured times.

#### Implementation Aspects[^6] {#implementation-aspects .unnumbered}

The *initial population* is obtained by first approximating the
threshold $\tau(\phi)$ with a binary search and then instantiating
random individuals with $\tau(\phi)$ positive bits. We employ the
algorithm with a very low *mutation rate* $p_m$, since this yields
better recombination results. Individuals to *recombine* are randomly
chosen using a normal distribution which prefers the best individuals.
In addition, we apply a recombination bias $p_r$ towards the individual
with the better score. We monitor the progress of the optimization and
spawn increasingly many independent individuals as the optimization
slows down. In the beginning, these random individuals are of
cardinality $|X|$ where $X$ is the best solution found so far. With
every generation which does not yield an improvement over the last, we
increase the deviation from $|X|$ in order to avoid getting stuck in a
local optimum.

Even though the strategies described here constitute only one possible
implementation, it yields very promising results, as the experimental
evaluations summarized in the next section will show.

## Experiments and Results {#sec:exp}

The solution proposed above has been implemented and evaluated using a
large corpus of verification instances. This section summarizes the most
important results obtained by this evaluation. To this end, we first
briefly provide details on the actual set-up as well as the considered
benchmarks. Afterwards, the obtained results are presented and
discussed.

### Set-up

As input for the considered problem, we used verification benchmarks
provided by the SMT-LIB benchmark library [@SMTLIB] (in the bit vector
logic QF_BV), and the SMT solver Z3 [@Moura2008Z3AE] as the reasoning
engine. The EA has been implemented in the programming language Scala
using the Java bindings of Z3.

In order to have a deterministic and reproducible notation of time for
the analysis, we used Z3's `rlimit` count as a time unit, which provides
the number of elementary operations required to solve an instance. This
way, the time measurements (required for the fitness function of the EA)
remain independent from the actual platform and hardware. The target
time-out $T_{max}$ was set to an `rlimit` count of $500\,000$ which is
roughly equivalent to $0.5s$ of computation on the utilized compute
server[^7].

Using this set-up, the verification runtime analysis determines the
desired set $X$ out of which the variables to be set to fixed values can
be obtained. Afterwards, the originally given proposition $\phi$ as well
as the proposition with the variables in $X$ set to ground terms is
solved by Z3 again --- showing the impact of the obtained analysis
results. For the evaluations, solving times have been measured on an
Intel Xeon (E3-1270 v3) compute server with 8 cores and 16 GB of memory
running Linux.

### Considered Benchmarks

Our methodology is meant for hard verification tasks which do not
terminate before a given time-out. The SMT-LIB library provides a huge,
representative corpus of such problems from the verification of circuits
and systems. We considered non-iterative quantifier-free bit vector
logic (QF_BV) benchmarks from the category "industrial" which are marked
as "unsat", where $\tau(\phi)$ (determined by binary search as described
above) is larger than 10; the latter ensures that trivial benchmarks
which complete in less than roughly $T_{max} \cdot 2^{10} \approx 512s$
are omitted.

With the remaining set of hard benchmarks, the proposed method has been
evaluated on a total of 333 propositions. The mean runtime $t_\text{A}$
of the analysis was 86 seconds. 34% (114) of the benchmarks were
analyzed in under 60 seconds, 93% (309) finished in less than 10
minutes, and the longest took 23 minutes 37 seconds. There was no
significant relation between the runtime of the analysis and the
original proof time.

### Obtained Results

Since due to space limitations not all results can be listed and
discussed, a representative subset of results is summarized in
Table [\[table:results\]](#table:results){reference-type="ref"
reference="table:results"}. Here, the first columns denote the problem
size: the number of SMT variables, and the number of bits
($|\operatorname{\textit{FV}}(\phi)|$) representing those SMT variables.
The next group of columns shows the results of the analysis:
$\tau(\phi)$ is the initially approximated number of variables that has
to be fixed, $|X|$ is the size (in bits) of the found solution $X$; and
$t_\text{A}$ is the runtime of the analysis itself. The last column
group shows the reduction in verification runtime: $T(\phi)$ is the
runtime with state-of-the-art verification (which results in a time-out
for all problems because we explicitly consider hard ones).
$\hat{T}^\text{rnd}_\phi(|X|)$ denotes the runtime when just an
arbitrary selection of variables
$Y \subset \operatorname{\textit{FV}}(\phi)$ with the same size
$|Y| = |X|$ is set to a fixed value, while $\hat{T}_{\phi}(X)$ denotes
the runtime when exactly the variables in $X$ are set to a fixed value.



The results clearly confirm the benefits of our approach. While it is in
general not surprising that fixing a number of variables reduces the
verification runtime, our analysis yields a small number $|X|$ of
variables to fix for maximum effect. By this, verification engineers get
much more out of partial verification since it allows them to only set a
small portion of the variables to a fixed value.
for *calypto/problem_22.smt2*, a naive method would have led them to set
$\tau(\phi)=128$ variables to a fixed value; with the sophisticated
analysis method proposed in this chapter, just fixing $|X|=13$ is
sufficient --- yielding substantially larger coverage.

Moreover, the results confirm that not only the number $|X|$ of
variables is important (*how many?*), but also which variables should be
set to a fixed value (*which?*). This can clearly be seen in the last
two columns of
Table [\[table:results\]](#table:results){reference-type="ref"
reference="table:results"}: randomly fixing $|X|$ variables often leads
to a time-out ($600s$). In contrast, fixing exactly those variables $X$
obtained by the proposed analysis allows solving *all* benchmarks in
negligible runtime.

### Further Discussions

The obtained results show how many and which variables to fix to get as
much as possible out of partial verification. In this regard, note that
there may be external reasons to fix (or not fix) a variable. For
example, it makes no sense to fix sensor input which changes rapidly,
but it makes a lot of sense to fix configuration parameters which rarely
change (see [@DATE2019]). Obviously such considerations can easily be
integrated into the proposed analysis  by adding a *weight* to the
variables such that instantiating some variables (which do not change
often) is favourable to instantiating others (which do change often).

With regard to related work, the term "partial verification" is also
used with model checking, in particular software model checking (see
 [@Parizek2007; @Groce2004]), referring to techniques to reduce the
search space in order to find counterexamples (and, hence, bugs), or
referring to the exchange of results between different automatic tools
(model checkers, static analyzers, theorem provers) such that the
combination of partial results makes the whole verification succeed (see
 [@Wuestholz; @Beyer2016]). This is also referred to as conditional
model checking [@Beyer2012]. Furthermore, the term is also used in the
context of agents [@Caragiannis2012; @Yu2011], but refers to
verification of truthfulness. However, the methodology proposed in this
work here is not related to any of these previous work and, hence, is
novel to the best of our knowledge.