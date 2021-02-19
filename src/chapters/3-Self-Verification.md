# Principles of Self-Verification

Based on the original work [@Selfie2]

## General Idea

The key idea of the proposed approach presented here is to defer part of the
verification until *after* deployment. At first sight, this seems like a rather strange
idea. A system deployed in the field is likely to have far less
computational power, memory and network resources available than a
design server. However, it has a main advantage which, we argue,
outweigh theses deficiencies: after deployment, there is generally
*more information* about the operating context available.

In order to enjoy this benefit, the design needs to be geared
towards verification after deployment. At an abstract level, the general
idea is to partition the system state space into one part which changes
frequently post-deployment and thus has to be explored symbolically, and one
part (preferably as large as possible) which only changes
infrequently. This part is called the *configuration*.
Marking a variable as a configuration variable means that
its value rarely changes, and entails that we can substitute actual
values before verification post-deployment. By marking variables of $n$ bits as
configuration variables, we reduce the search space we need to explore for
verification by $2^n$ --- turning the exponential growth into an exponential
reduction.

The idea and its benefits are illustrated by the following (running)
example, which has been deliberately kept simple in order to keep the focus on the methodology.

![Bringing light into darkness: The light controller is connected
to a luminosity sensor, and switches a light on or off when it becomes
too dark or bright.](light-sensor-sketch.svg){#fig:sketch}

:::example
  The simple light controller system sketched in [](#fig:sketch)
  works as the running example in the following. This system
  connects a controller to a luminosity sensor and a light switch. The
  controller should turn on the light if the sensor $e$ drops below a given
  level $e_{lo}$, and turn it off if it exceeds a given level $e_{hi}$. To
  avoid a flickering effect when the luminosity varies close to a given
  threshold, the lower and upper threshold levels are not equal
  (hysteresis), and the system should switch off the light only with a
  certain delay $d$.

  The threshold levels $e_{lo}, e_{hi}$ and the delay $d$ are
  configuration variables, and can be changed post-deployment.
:::

Systems like these are designed in a flexible fashion, so that they
can be applied in various contexts. For the light controller, the threshold levels and delay are not fixed at
design or production time but will be set post-deployment.  Hence, in order to verify the correctness of the system, we need to take into account
*all* possible configurations, which increases the search space
exponentially. It also means that a lot of possible configurations are
checked during verification which may never be applied during the system's
lifetime. Hence, if we instantiate the configuration variables after
deployment and keep only the variables of the system which change frequently arbitrary, we get a much smaller search space to explore.

:::example continued
Consider again the running example. If we assume a width of
8 bit for the input values (the luminosity sensor and
subsequently for the upper and lower bounds) and the time delay,
and one bit for the light switch status
(these are lower bounds for a realistic system), we get the following
search space (where *cnt* is a variable counting up to delay):

<!-- TODO EQ -->
  
Thus, we need to check an overall search space of $2^{41}$ states to verify the
system, a huge search space for a very simple example.

In contrast, once the system is deployed and applied in the field, the
values for $e_{lo}$, $e_{hi}$ and $d$ rarely change (once when
the system is deployed, and afterwards only if the user actively changes
the configuration), as opposed to the values of $e$, $cnt$ and
$status$ which vary constantly. Thus, we can mark $e_{lo}$, $e_{hi}$
and $d$ as configuration variables, and verify the system only
when the configuration is changed. By keeping the values of $e_{lo}$,
$e_{hi}$ and $d$ fixed for the verification, the search
space reduces to $2^{17}$ states.
:::

The reduced search space can be handled comfortably by a lightweight solver
after deployment, even under the prevailing conditions of limited
computational resources.  But note that this verification is only valid for
the particular configuration (i.e. the supplied values for 
$e_{lo}, e_{hi}$ and $d$) and, thus, can principally not be done prior to deployment
without severely reducing the flexibility and versatility of the system.

## Implementation

The previous section illustrated the potential of conducting verification
after deployment.  Based on that, we now describe in detail a possible
implementation of this methodology. We first describe the
design process in more detail, and then demonstrate it at work with a
formal development of the running example considered in the previous section.

### The Design Process

The design flow starts with a *modelling phase*, where the structure
and behaviour of the system is modelled at an abstract level without
referring to any implementation details (see \FigRef{fig:design-flow}). In
our case, we use SysML [@SysML] and OCL [@RichtersGogolla:2002] to
specify the structure and formalize constraints on its behaviour as well as the
functional hardware description language Clash [@CLaSH] for a uniform,
executable and synthesizeable model of the system.

The actual specification and implementation languages are of no
particular relevance and could be replaced by others (e.g. we could use
UML instead of SysML, or SystemC instead of Clash), but serve here to
point out the level of abstraction in the corresponding part of the
design process.

From the model, we can synthesize an *implementation* of the system
by generating a representation in a low-level hardware modelling language such as VHDL or
Verilog, which is used to program an FPGA -- constituting the actual
implementation. Moreover, we want to *verify* that the generated
system behaves as specified. In order to do so, we generate a list of
*verification conditions* from the executable system model and the
specification which have to be shown in order to guarantee this.
%
Specifically, we translate both the Clash model and the constraints from
the OCL specification into *bit-vector logic* (i.e. first-order logic
with bit-vectors). Trying to show these in an SMT prover such as
Yices [@Dutertre:2014] or Z3 [@Z3] fails for non-trivial examples, as does trying to show the properties
translated into *conjunctive normal form* (CNF) with a SAT solver such as
MiniSat. This is where verification usually fails.

However, post-deployment after we have instantiated the configuration
variables, the search space is small enough to allow verification of the
corresponding properties even by a lightweight solver [@Bornebusch2017TowardsLS].
By this, verification of all properties becomes possible. Recall that this
instantiation cannot be done at the design time, because at that point the
instantiating values are still unknown. Therefore, the proofs must be rerun
if the values of the configuration variables are changed.